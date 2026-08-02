import { createAdminClient } from './supabase/server'
import type { TopicScore } from './diagnosticGrading'
import type { DiagnosticResultData, QuestionReviewItem } from '@/components/diagnostic/DiagnosticResultSummary'

export type DiagnosticResultLookup =
  | { status: 'not_found' }
  | { status: 'in_progress' }
  | { status: 'completed'; result: DiagnosticResultData }

// Shared by app/diagnostic/[slug]/results/[attemptId]/page.tsx (public) and
// app/teacher/diagnostics/[testId]/attempts/[attemptId]/page.tsx (teacher) —
// same assembled shape either way, read from the frozen topic_breakdown
// snapshot rather than recomputing scores live.
export async function getDiagnosticResult(attemptId: string): Promise<DiagnosticResultLookup> {
  const admin = await createAdminClient()

  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, diagnostic_test_id, lead_id, status, started_at, submitted_at, correct_count, total_count, score_pct, topic_breakdown')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return { status: 'not_found' }
  if (attempt.status !== 'completed') return { status: 'in_progress' }

  const [{ data: test }, { data: lead }, { data: answers }] = await Promise.all([
    admin.from('diagnostic_tests').select('title').eq('id', attempt.diagnostic_test_id).maybeSingle(),
    admin.from('diagnostic_leads').select('student_name').eq('id', attempt.lead_id).maybeSingle(),
    admin.from('diagnostic_attempt_answers').select('question_id, selected_index, is_correct, canvas_data').eq('attempt_id', attemptId),
  ])

  const breakdown = (attempt.topic_breakdown ?? { topicScores: [], advice: [] }) as {
    topicScores: TopicScore[]
    advice: { topicTitle: string; prepAdvice: string }[]
  }

  // Per-question review: read live from diagnostic_questions (current content/
  // options/explanation) rather than freezing a second snapshot — unlike the
  // topic_breakdown/advice above (which lock in prep_advice text that could
  // later change), showing the up-to-date question is what a student actually
  // wants when reviewing what they got wrong.
  const questionIds = (answers ?? []).map(a => a.question_id)
  const { data: reviewQuestions } = questionIds.length > 0
    ? await admin.from('diagnostic_questions').select('id, content, image_url, mcq_options, mcq_correct_index, question_type, explanation, answer_key').in('id', questionIds)
    : { data: [] as { id: string; content: string; image_url: string | null; mcq_options: string[] | null; mcq_correct_index: number | null; question_type: 'mcq' | 'frq'; explanation: string | null; answer_key: string | null }[] }
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
      }
    })
    .filter((r): r is QuestionReviewItem => r !== null)

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
      timeSpentSeconds,
      topicScores: breakdown.topicScores,
      advice: breakdown.advice,
      questionReview,
    },
  }
}
