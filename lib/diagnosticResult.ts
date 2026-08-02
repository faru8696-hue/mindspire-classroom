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
    .select('id, diagnostic_test_id, lead_id, status, started_at, submitted_at, correct_count, total_count, score_pct')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return { status: 'not_found' }
  if (attempt.status !== 'completed') return { status: 'in_progress' }

  const [{ data: test }, { data: lead }, { data: answers }] = await Promise.all([
    admin.from('diagnostic_tests').select('title').eq('id', attempt.diagnostic_test_id).maybeSingle(),
    admin.from('diagnostic_leads').select('student_name').eq('id', attempt.lead_id).maybeSingle(),
    admin.from('diagnostic_attempt_answers').select('question_id, selected_index, is_correct, canvas_data, points_earned').eq('attempt_id', attemptId),
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

  const mcqTopicRows = (answers ?? [])
    .filter(a => a.is_correct !== null)
    .map(a => {
      const topicId = questionById.get(a.question_id)?.topic_id
      if (!topicId) return null
      return { topicId, topicTitle: topicById.get(topicId)?.title ?? 'Unknown', isCorrect: a.is_correct as boolean }
    })
    .filter((r): r is { topicId: string; topicTitle: string; isCorrect: boolean } => r !== null)

  const topicScores = aggregateTopicScores(mcqTopicRows)
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
      topicScores,
      advice,
      questionReview,
    },
  }
}
