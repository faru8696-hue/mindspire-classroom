import { createAdminClient } from './supabase/server'
import type { TopicScore } from './diagnosticGrading'
import type { DiagnosticResultData } from '@/components/diagnostic/DiagnosticResultSummary'

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

  const [{ data: test }, { data: lead }] = await Promise.all([
    admin.from('diagnostic_tests').select('title').eq('id', attempt.diagnostic_test_id).maybeSingle(),
    admin.from('diagnostic_leads').select('student_name').eq('id', attempt.lead_id).maybeSingle(),
  ])

  const breakdown = (attempt.topic_breakdown ?? { topicScores: [], advice: [] }) as {
    topicScores: TopicScore[]
    advice: { topicTitle: string; prepAdvice: string }[]
  }

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
    },
  }
}
