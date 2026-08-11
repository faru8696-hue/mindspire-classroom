import { createAdminClient } from './supabase/server'
import { aggregateTopicScores } from './diagnosticGrading'
import type { DiagnosticResultData, QuestionReviewItem } from '@/components/diagnostic/DiagnosticResultSummary'

export type DiagnosticResultLookup =
  | { status: 'not_found' }
  | { status: 'in_progress' }
  | { status: 'completed'; result: DiagnosticResultData }

// Shared by app/diagnostic/[slug]/results/[attemptId]/page.tsx (public) and
// app/teacher/diagnostics/[testId]/attempts/[attemptId]/page.tsx (teacher) —
// same assembled shape either way. Topic performance and advice are
// recomputed live from each question's CURRENT topic_id and each topic's
// CURRENT prep_advice, rather than read from the topic_breakdown snapshot
// frozen at submit time — a teacher reorganizing questions into finer
// subtopics (or editing advice text) should be reflected in results
// immediately, including for attempts submitted before the reorganization.
export async function getDiagnosticResult(attemptId: string): Promise<DiagnosticResultLookup> {
  const admin = await createAdminClient()

  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, diagnostic_test_id, lead_id, status, started_at, submitted_at, correct_count, total_count, score_pct, tab_switch_count, tab_switch_seconds, results_released')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return { status: 'not_found' }
  if (attempt.status !== 'completed') return { status: 'in_progress' }

  // Fetched separately, defaulting to "no deduction" on any error — these
  // columns only exist once add-diagnostic-integrity-deduction.sql has been
  // run. Selecting them in the main query above would make an unrun
  // migration silently break every result lookup site-wide (a real
  // incident: it did, briefly) instead of just leaving deductions off.
  const { data: integrityRow } = await admin
    .from('diagnostic_attempts')
    .select('integrity_deduction_pct, integrity_likely_cheating')
    .eq('id', attemptId)
    .maybeSingle()

  // Same defensive pattern, for add-diagnostic-overtime.sql — an
  // independent migration from the integrity one above.
  const { data: overtimeRow } = await admin
    .from('diagnostic_attempts')
    .select('submitted_late, overtime_seconds, overtime_accepted')
    .eq('id', attemptId)
    .maybeSingle()

  // Same defensive pattern, for add-diagnostic-integrity-waiver.sql — a
  // third independent migration. Kept separate from integrityRow above
  // (rather than adding a column to that same migration) since that file
  // may already have been run before this one existed.
  const { data: waiverRow } = await admin
    .from('diagnostic_attempts')
    .select('integrity_deduction_waived')
    .eq('id', attemptId)
    .maybeSingle()
  const integrityDeductionWaived = waiverRow?.integrity_deduction_waived ?? false
  const rawIntegrityDeductionPct = integrityRow?.integrity_deduction_pct ?? 0

  const [{ data: test }, { data: lead }, { data: answers }] = await Promise.all([
    admin.from('diagnostic_tests').select('title').eq('id', attempt.diagnostic_test_id).maybeSingle(),
    admin.from('diagnostic_leads').select('student_name').eq('id', attempt.lead_id).maybeSingle(),
    admin.from('diagnostic_attempt_answers').select('question_id, selected_index, is_correct, canvas_data, points_earned, teacher_annotation').eq('attempt_id', attemptId),
  ])

  // Per-question review: read live from diagnostic_questions (current
  // content/options/explanation/topic) rather than freezing a snapshot —
  // showing the up-to-date question (and which subtopic it's currently
  // filed under) is what a teacher/student actually wants.
  const questionIds = (answers ?? []).map(a => a.question_id)
  const { data: reviewQuestions } = questionIds.length > 0
    ? await admin.from('diagnostic_questions').select('id, content, image_url, mcq_options, mcq_correct_index, question_type, explanation, answer_key, points, topic_id').in('id', questionIds)
    : { data: [] as { id: string; content: string; image_url: string | null; mcq_options: string[] | null; mcq_correct_index: number | null; question_type: 'mcq' | 'frq'; explanation: string | null; answer_key: string | null; points: number | null; topic_id: string }[] }
  const questionById = new Map((reviewQuestions ?? []).map(q => [q.id, q]))
  const questionReview: QuestionReviewItem[] = (answers ?? [])
    .map(a => {
      const q = questionById.get(a.question_id)
      if (!q) return null
      return {
        questionId: a.question_id,
        content: q.content,
        imageUrl: q.image_url,
        questionType: q.question_type ?? 'mcq',
        options: q.mcq_options,
        selectedIndex: a.selected_index,
        correctIndex: q.mcq_correct_index,
        isCorrect: a.is_correct,
        explanation: q.explanation,
        answerKey: q.answer_key,
        canvasData: a.canvas_data,
        teacherAnnotation: a.teacher_annotation,
        points: q.points ?? null,
        pointsEarned: a.points_earned ?? null,
      }
    })
    .filter((r): r is QuestionReviewItem => r !== null)

  // Topic performance + advice, computed live from current topic
  // assignments/prep_advice (see function comment above).
  const allTopicIds = [...new Set((reviewQuestions ?? []).map(q => q.topic_id))]
  const { data: topicRows } = allTopicIds.length > 0
    ? await admin.from('diagnostic_topics').select('id, title, prep_advice').in('id', allTopicIds)
    : { data: [] as { id: string; title: string; prep_advice: string | null }[] }
  const topicById = new Map((topicRows ?? []).map(t => [t.id, t]))

  // Points-based per-topic rows so a topic's mastery bar reflects BOTH its
  // MCQ questions (1 point each) and any graded FRQ questions (their
  // authored points), not MCQ alone — an FRQ-heavy topic used to show no
  // score at all here even once fully graded. Ungraded FRQ rows are
  // skipped (aggregateTopicScores drops possible <= 0), same rule as the
  // overall FRQ score above.
  const scoreTopicRows = (answers ?? [])
    .map(a => {
      const q = questionById.get(a.question_id)
      if (!q) return null
      const topicId = q.topic_id
      const topicTitle = topicById.get(topicId)?.title ?? 'Unknown'
      if (q.question_type === 'frq') {
        if (a.points_earned === null || q.points === null) return null
        return { topicId, topicTitle, earned: a.points_earned, possible: q.points }
      }
      if (a.is_correct === null) return null
      return { topicId, topicTitle, earned: a.is_correct ? 1 : 0, possible: 1 }
    })
    .filter((r): r is { topicId: string; topicTitle: string; earned: number; possible: number } => r !== null)

  const topicScores = aggregateTopicScores(scoreTopicRows)
  const advice = topicScores
    .filter(t => t.tier !== 'mastered')
    .map(t => {
      const prepAdvice = topicById.get(t.topicId)?.prep_advice
      return prepAdvice ? { topicTitle: t.topicTitle, prepAdvice } : null
    })
    .filter((a): a is { topicTitle: string; prepAdvice: string } => a !== null)

  // FRQ score, computed live (not frozen like the MCQ score) since teacher
  // grading happens progressively any time after the attempt completes.
  // gradedPoints/totalPoints (not earnedPoints/totalPoints) drives the pct
  // shown while review is still in progress, so a partially-reviewed
  // attempt shows an accurate percentage of what's been graded so far
  // rather than treating ungraded questions as worth 0.
  const frqItems = questionReview.filter(q => q.questionType === 'frq')
  const frqScore = frqItems.length === 0 ? null : (() => {
    const gradedItems = frqItems.filter(q => q.pointsEarned !== null)
    const totalPoints = frqItems.reduce((sum, q) => sum + (q.points ?? 0), 0)
    const gradedPoints = gradedItems.reduce((sum, q) => sum + (q.points ?? 0), 0)
    const earnedPoints = gradedItems.reduce((sum, q) => sum + (q.pointsEarned ?? 0), 0)
    return { totalCount: frqItems.length, gradedCount: gradedItems.length, totalPoints, gradedPoints, earnedPoints }
  })()

  const timeSpentSeconds = attempt.submitted_at
    ? Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 1000)
    : null

  // How many questions were left blank — surfaced so a low score can be
  // read correctly as "ran out of time" rather than "didn't know the
  // material" when that's the more likely explanation (see
  // DiagnosticResultSummary's low-score note).
  const unansweredCount = questionReview.filter(q =>
    q.questionType === 'mcq' ? (q.selectedIndex === null || q.selectedIndex === -1) : !q.canvasData
  ).length

  return {
    status: 'completed',
    result: {
      testTitle: test?.title ?? 'Diagnostic Test',
      studentName: lead?.student_name ?? 'Student',
      dateTaken: attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : '',
      correctCount: attempt.correct_count ?? 0,
      totalCount: attempt.total_count ?? 0,
      scorePct: attempt.score_pct ?? 0,
      frqScore,
      timeSpentSeconds,
      // Neutral fact, teacher-page-only (never rendered on the student
      // results page) — see DiagnosticTestSession's tab-switch tracking.
      tabSwitchCount: attempt.tab_switch_count ?? 0,
      tabSwitchSeconds: attempt.tab_switch_seconds ?? 0,
      // Frozen at submit time (see assessTestIntegrity) — shown to both
      // student and parent, unlike the raw tab-switch counter above. Zeroed
      // out whenever the teacher has waived it (integrityDeductionWaived),
      // so every consumer (this summary, the PDF, result emails) just sees
      // "no deduction" without needing its own waiver-aware logic — the
      // original computed value is preserved separately below for the
      // teacher's own reference.
      integrityDeductionPct: integrityDeductionWaived ? 0 : rawIntegrityDeductionPct,
      integrityLikelyCheating: integrityDeductionWaived ? false : (integrityRow?.integrity_likely_cheating ?? false),
      integrityDeductionWaived,
      integrityRawDeductionPct: rawIntegrityDeductionPct,
      // Whether this attempt was submitted after the time limit (only
      // possible when the test's allow_overtime was on), how far past, and
      // whether the teacher has explicitly accepted it — release-results
      // and email-result both refuse to release a late+unaccepted attempt.
      submittedLate: overtimeRow?.submitted_late ?? false,
      overtimeSeconds: overtimeRow?.overtime_seconds ?? 0,
      overtimeAccepted: overtimeRow?.overtime_accepted ?? null,
      unansweredCount,
      totalQuestionCount: questionReview.length,
      // Gates the PUBLIC results page only — the teacher's own attempt page
      // always shows full results regardless of this flag (see
      // app/diagnostic/[slug]/results/[attemptId]/page.tsx vs.
      // app/teacher/diagnostics/[testId]/attempts/[attemptId]/page.tsx).
      resultsReleased: attempt.results_released,
      topicScores,
      advice,
      questionReview,
    },
  }
}
