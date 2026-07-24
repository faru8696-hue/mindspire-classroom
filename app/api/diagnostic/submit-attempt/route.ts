import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { gradeDiagnosticAttempt, type DiagnosticQuestionForGrading } from '@/lib/diagnosticGrading'

// Public endpoint, no session — grading always happens server-side from the
// stored mcq_correct_index, never trusting a client-submitted "isCorrect".
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    attemptId?: string
    answers?: { questionId: string; selectedIndex: number }[]
  } | null

  const attemptId = body?.attemptId
  const answers = body?.answers ?? []
  if (!attemptId) return NextResponse.json({ error: 'Missing attemptId.' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, diagnostic_test_id, question_ids, status')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 })

  // Idempotent: a back-button-then-resubmit just gets told it's already done,
  // rather than erroring or attempting a duplicate grade/insert.
  if (attempt.status === 'completed') {
    return NextResponse.json({ attemptId: attempt.id, alreadyCompleted: true })
  }

  const questionIds = attempt.question_ids as string[]
  const { data: questions } = await admin
    .from('diagnostic_questions')
    .select('id, topic_id, mcq_correct_index')
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
      mcqCorrectIndex: q.mcq_correct_index,
      prepAdvice: topic?.prep_advice ?? null,
    }
  })

  const graded = gradeDiagnosticAttempt(answers, gradingQuestions)

  const answerRows = graded.perQuestion.map(pq => {
    const submitted = answers.find(a => a.questionId === pq.questionId)
    return {
      attempt_id: attempt.id,
      question_id: pq.questionId,
      selected_index: submitted?.selectedIndex ?? -1,
      is_correct: pq.isCorrect,
    }
  })
  if (answerRows.length > 0) {
    const { error: answersError } = await admin.from('diagnostic_attempt_answers').insert(answerRows)
    if (answersError) console.error('submit-attempt answers insert error:', answersError)
  }

  // Frozen at submit time — topic scores AND advice text, so a later edit to
  // a topic's prep_advice or a question's topic assignment can never
  // retroactively rewrite a student's historical results/PDF.
  const { error: updateError } = await admin
    .from('diagnostic_attempts')
    .update({
      status: 'completed',
      submitted_at: new Date().toISOString(),
      correct_count: graded.correctCount,
      total_count: graded.totalCount,
      score_pct: graded.scorePct,
      topic_breakdown: { topicScores: graded.topicScores, advice: graded.advice },
    })
    .eq('id', attempt.id)

  if (updateError) {
    console.error('submit-attempt update error:', updateError)
    return NextResponse.json({ error: 'Could not save your results. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ attemptId: attempt.id })
}
