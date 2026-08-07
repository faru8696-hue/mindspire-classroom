import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { gradeDiagnosticAttempt, assessTestIntegrity, type DiagnosticQuestionForGrading } from '@/lib/diagnosticGrading'

// Public endpoint, no session — grading always happens server-side from the
// stored mcq_correct_index, never trusting a client-submitted "isCorrect".
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    attemptId?: string
    answers?: { questionId: string; selectedIndex?: number; canvasData?: string | null }[]
    tabSwitchCount?: number
    tabSwitchSeconds?: number
  } | null

  const attemptId = body?.attemptId
  const answers = body?.answers ?? []
  if (!attemptId) return NextResponse.json({ error: 'Missing attemptId.' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, diagnostic_test_id, lead_id, question_ids, status')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 })

  // Idempotent: a back-button-then-resubmit just gets told it's already done,
  // rather than erroring or attempting a duplicate grade/insert.
  if (attempt.status === 'completed') {
    return NextResponse.json({ attemptId: attempt.id, alreadyCompleted: true })
  }

  const { data: test } = await admin
    .from('diagnostic_tests')
    .select('duration_minutes, class_id')
    .eq('id', attempt.diagnostic_test_id)
    .maybeSingle()

  const questionIds = attempt.question_ids as string[]
  const { data: questions } = await admin
    .from('diagnostic_questions')
    .select('id, topic_id, question_type, mcq_correct_index')
    .in('id', questionIds)

  const topicIds = [...new Set((questions ?? []).map(q => q.topic_id))]
  const { data: topics } = topicIds.length > 0
    ? await admin.from('diagnostic_topics').select('id, title, prep_advice').in('id', topicIds)
    : { data: [] as { id: string; title: string; prep_advice: string | null }[] }
  const topicById = new Map((topics ?? []).map(t => [t.id, t]))

  const gradingQuestions: DiagnosticQuestionForGrading[] = (questions ?? []).map(q => {
    const topic = topicById.get(q.topic_id)
    return {
      id: q.id,
      topicId: q.topic_id,
      topicTitle: topic?.title ?? 'Unknown topic',
      questionType: (q.question_type as 'mcq' | 'frq') ?? 'mcq',
      mcqCorrectIndex: q.mcq_correct_index,
      prepAdvice: topic?.prep_advice ?? null,
    }
  })

  const graded = gradeDiagnosticAttempt(answers, gradingQuestions)

  // Frozen at submit time, same reasoning as topic_breakdown below — a later
  // tuning of the deduction curve must never retroactively change a
  // historical attempt's grade.
  const integrity = assessTestIntegrity(
    body?.tabSwitchSeconds ?? 0,
    body?.tabSwitchCount ?? 0,
    test?.duration_minutes ?? 60,
  )

  const answerRows = graded.perQuestion.map(pq => {
    const submitted = answers.find(a => a.questionId === pq.questionId)
    if (pq.questionType === 'frq') {
      return {
        attempt_id: attempt.id,
        question_id: pq.questionId,
        selected_index: null,
        is_correct: null,
        canvas_data: submitted?.canvasData ?? null,
      }
    }
    return {
      attempt_id: attempt.id,
      question_id: pq.questionId,
      selected_index: submitted?.selectedIndex ?? -1,
      is_correct: pq.isCorrect,
      // Rough-work scratch board, not graded — just saved for the student's
      // (and teacher's) own reference alongside the picked answer.
      canvas_data: submitted?.canvasData ?? null,
    }
  })
  if (answerRows.length > 0) {
    // Upsert, not insert — autosave (see /api/diagnostic/autosave-attempt)
    // may have already created draft rows for some of these questions while
    // the student was mid-test; this overwrites them with the final graded
    // values instead of colliding with the unique (attempt_id, question_id)
    // index.
    const { error: answersError } = await admin
      .from('diagnostic_attempt_answers')
      .upsert(answerRows, { onConflict: 'attempt_id,question_id' })
    if (answersError) console.error('submit-attempt answers insert error:', answersError)
  }

  // Frozen at submit time — topic scores AND advice text, so a later edit to
  // a topic's prep_advice or a question's topic assignment can never
  // retroactively rewrite a student's historical results/PDF.
  //
  // This core update must never depend on integrity_deduction_pct/
  // integrity_likely_cheating existing — those columns only exist once
  // add-diagnostic-integrity-deduction.sql has been run, and including them
  // here would fail the ENTIRE update (blocking every test submission
  // app-wide) whenever that migration hasn't run yet. The integrity fields
  // are written in a separate, best-effort call right after.
  const { error: updateError } = await admin
    .from('diagnostic_attempts')
    .update({
      status: 'completed',
      submitted_at: new Date().toISOString(),
      correct_count: graded.correctCount,
      total_count: graded.totalCount,
      score_pct: graded.scorePct,
      topic_breakdown: { topicScores: graded.topicScores, advice: graded.advice },
      // Neutral "left the test tab" counter — not a screenshot detector,
      // just visibilitychange/blur tracking (see DiagnosticTestSession).
      tab_switch_count: body?.tabSwitchCount ?? 0,
      tab_switch_seconds: body?.tabSwitchSeconds ?? 0,
    })
    .eq('id', attempt.id)

  const { error: integrityUpdateError } = await admin
    .from('diagnostic_attempts')
    .update({
      integrity_deduction_pct: integrity.deductionPct,
      integrity_likely_cheating: integrity.likelyCheating,
    })
    .eq('id', attempt.id)
  if (integrityUpdateError) console.error('submit-attempt integrity update error (migration likely not run yet):', integrityUpdateError)

  if (updateError) {
    console.error('submit-attempt update error:', updateError)
    return NextResponse.json({ error: 'Could not save your results. Please try again.' }, { status: 500 })
  }

  // Surface "student completed a test" in the teacher bell/activity feed —
  // only possible when the test-taker was logged in (lead.student_id is
  // only set via the start-attempt-for-student route, not the public/
  // anonymous start-attempt) and the test is published to a class (a
  // notification has to belong to some class for the bell's mute-by-class
  // and roster grouping to work).
  const { data: lead } = await admin.from('diagnostic_leads').select('student_id').eq('id', attempt.lead_id).maybeSingle()
  if (lead?.student_id && test?.class_id) {
    const { error: notifError } = await admin.from('notifications').insert({
      type: 'test_completed',
      student_id: lead.student_id,
      class_id: test.class_id,
      question_id: null,
      diagnostic_test_id: attempt.diagnostic_test_id,
      diagnostic_attempt_id: attempt.id,
      read: false,
    })
    if (notifError) console.error('submit-attempt notification insert error:', notifError)
  }

  return NextResponse.json({ attemptId: attempt.id })
}
