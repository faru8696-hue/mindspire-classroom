import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { aggregateTopicScores, computeTotalScore } from '@/lib/diagnosticGrading'
import TestTitleEditor from '@/components/diagnostic/TestTitleEditor'
import TestTimingEditor from '@/components/diagnostic/TestTimingEditor'
import StudentResultsTable, { type StudentResultRow } from '@/components/diagnostic/StudentResultsTable'
import PublishToClass from '@/components/diagnostic/PublishToClass'
import DeleteTestButton from '@/components/diagnostic/DeleteTestButton'
import ActiveToggle from '@/components/diagnostic/ActiveToggle'

export default async function DiagnosticTestDashboardPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const { testId } = await params
  const admin = await createAdminClient()

  const { data: test } = await admin
    .from('diagnostic_tests')
    .select('id, title, slug, description, question_count_per_attempt, duration_minutes, is_active, class_id')
    .eq('id', testId)
    .maybeSingle()
  if (!test) notFound()

  // Fetched separately, defaulting to "off" on error — allow_overtime only
  // exists once add-diagnostic-overtime.sql has been run (same defensive
  // pattern as the integrity-deduction fields: the main test query above
  // must never depend on a column that might not exist yet).
  const { data: overtimeRow } = await admin.from('diagnostic_tests').select('allow_overtime').eq('id', testId).maybeSingle()

  // Same defensive pattern, for add-diagnostic-instant-results.sql —
  // defaults to true on error (matches the DB column's own default) since
  // every test on this public route is a lead-magnet quiz.
  const { data: instantRow } = await admin.from('diagnostic_tests').select('instant_results').eq('id', testId).maybeSingle()

  const { data: classes } = await admin.from('classes').select('id, title').order('order_index')

  const { data: attempts } = await admin
    .from('diagnostic_attempts')
    .select('id, lead_id, status, started_at, submitted_at, correct_count, total_count, score_pct, results_released')
    .eq('diagnostic_test_id', testId)
    .eq('status', 'completed')
    .order('submitted_at', { ascending: false })

  const leadIds = [...new Set((attempts ?? []).map(a => a.lead_id))]
  const { data: leads } = leadIds.length > 0
    ? await admin.from('diagnostic_leads').select('id, student_name, student_email, parent_name, parent_email, parent_phone').in('id', leadIds)
    : { data: [] as { id: string; student_name: string; student_email: string; parent_name: string; parent_email: string; parent_phone: string }[] }
  const leadById = new Map((leads ?? []).map(l => [l.id, l]))

  const n = attempts?.length ?? 0

  // Class Struggles + per-student FRQ scores both need every answer for
  // this test's completed attempts, joined to each question's CURRENT
  // topic/type/points — same live-recompute approach as
  // lib/diagnosticResult.ts, so a subtopic reorganization or FRQ grading
  // shows up here immediately instead of only on the per-attempt page.
  const attemptIds = (attempts ?? []).map(a => a.id)
  const { data: answers } = attemptIds.length > 0
    ? await admin.from('diagnostic_attempt_answers').select('attempt_id, question_id, is_correct, points_earned').in('attempt_id', attemptIds)
    : { data: [] as { attempt_id: string; question_id: string; is_correct: boolean | null; points_earned: number | null }[] }
  const questionIds = [...new Set((answers ?? []).map(a => a.question_id))]
  const { data: questions } = questionIds.length > 0
    ? await admin.from('diagnostic_questions').select('id, topic_id, question_type, points').in('id', questionIds)
    : { data: [] as { id: string; topic_id: string; question_type: 'mcq' | 'frq'; points: number | null }[] }
  const questionById = new Map((questions ?? []).map(q => [q.id, q]))
  const topicIds = [...new Set((questions ?? []).map(q => q.topic_id))]
  const { data: topics } = topicIds.length > 0
    ? await admin.from('diagnostic_topics').select('id, title').in('id', topicIds)
    : { data: [] as { id: string; title: string }[] }
  const topicTitleById = new Map((topics ?? []).map(t => [t.id, t.title]))

  // Points-based, same as lib/diagnosticResult.ts's per-attempt breakdown —
  // graded FRQ points count toward a topic's mastery %, not just MCQ.
  // Ungraded FRQ rows are skipped (aggregateTopicScores drops possible <= 0).
  const classStruggleRows = (answers ?? [])
    .map(a => {
      const q = questionById.get(a.question_id)
      if (!q) return null
      const topicId = q.topic_id
      const topicTitle = topicTitleById.get(topicId) ?? 'Unknown'
      if (q.question_type === 'frq') {
        if (a.points_earned === null || q.points === null) return null
        return { topicId, topicTitle, earned: a.points_earned, possible: q.points }
      }
      if (a.is_correct === null) return null
      return { topicId, topicTitle, earned: a.is_correct ? 1 : 0, possible: 1 }
    })
    .filter((r): r is { topicId: string; topicTitle: string; earned: number; possible: number } => r !== null)
  const classStruggles = aggregateTopicScores(classStruggleRows).filter(t => t.tier !== 'mastered')

  // Per-attempt FRQ score, same shape/logic as lib/diagnosticResult.ts.
  const frqByAttempt = new Map<string, { totalCount: number; gradedCount: number; totalPoints: number; gradedPoints: number; earnedPoints: number }>()
  for (const a of answers ?? []) {
    const q = questionById.get(a.question_id)
    if (q?.question_type !== 'frq') continue
    const entry = frqByAttempt.get(a.attempt_id) ?? { totalCount: 0, gradedCount: 0, totalPoints: 0, gradedPoints: 0, earnedPoints: 0 }
    entry.totalCount += 1
    entry.totalPoints += q.points ?? 0
    if (a.points_earned !== null) {
      entry.gradedCount += 1
      entry.gradedPoints += q.points ?? 0
      entry.earnedPoints += a.points_earned
    }
    frqByAttempt.set(a.attempt_id, entry)
  }

  const studentRows: StudentResultRow[] = (attempts ?? []).map(a => {
    const lead = leadById.get(a.lead_id)
    const frq = frqByAttempt.get(a.id) ?? null
    const total = computeTotalScore(a.correct_count ?? 0, a.total_count ?? 0, frq)
    return {
      attemptId: a.id,
      leadId: a.lead_id,
      studentName: lead?.student_name ?? 'Unknown',
      studentEmail: lead?.student_email ?? '',
      parentName: lead?.parent_name ?? '',
      parentPhone: lead?.parent_phone ?? '',
      correctCount: total.earned,
      totalCount: total.possible,
      scorePct: total.pct,
      fullyGraded: total.fullyGraded,
      hasFrq: frq !== null,
      timeSpentMinutes: a.submitted_at ? Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 60000) : 0,
      submittedAt: a.submitted_at,
      resultsReleased: a.results_released,
    }
  })

  const avgPct = n > 0 ? Math.round(studentRows.reduce((sum, r) => sum + (r.scorePct ?? 0), 0) / n) : 0

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/teacher/diagnostics" className="text-blue-600 text-sm hover:underline block mb-2">← All Tests</Link>
      <div className="flex items-center justify-between mb-1">
        <TestTitleEditor testId={testId} title={test.title} description={test.description} />
        <div className="flex items-center gap-2">
          <ActiveToggle testId={testId} isActive={test.is_active} />
          <Link href={`/teacher/diagnostics/${testId}/topics`} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition">Manage Topics</Link>
          <Link href={`/teacher/diagnostics/${testId}/questions`} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition">Manage Questions</Link>
          <DeleteTestButton testId={testId} title={test.title} />
        </div>
      </div>
      <div className="mb-3">
        <TestTimingEditor testId={testId} title={test.title} durationMinutes={test.duration_minutes} allowOvertime={overtimeRow?.allow_overtime ?? false} instantResults={instantRow?.instant_results ?? true} />
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Public link: <a href={`/diagnostic/${test.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">/diagnostic/{test.slug}</a>
      </p>

      <div className="mb-6">
        <PublishToClass testId={testId} classId={test.class_id} classes={classes ?? []} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow p-5 text-center">
          <div className="text-3xl font-black text-indigo-600">{n}</div>
          <div className="text-sm text-gray-500 font-medium">Students Tested</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 text-center">
          <div className="text-3xl font-black text-green-600">{avgPct}%</div>
          <div className="text-sm text-gray-500 font-medium">Class Average</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 text-center">
          <div className="text-3xl font-black text-blue-600">{n}</div>
          <div className="text-sm text-gray-500 font-medium">Tests Completed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold text-gray-800 mb-4">Student Results</h3>
          <StudentResultsTable testId={testId} rows={studentRows} />
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold text-gray-800 mb-4">Class Struggles</h3>
          {classStruggles.length === 0 ? (
            <p className="text-green-600 font-medium">🎉 No class-wide struggles detected!</p>
          ) : (
            classStruggles.map(t => (
              <Link
                key={t.topicId}
                href={`/teacher/diagnostics/${testId}/topics/${t.topicId}`}
                className="flex justify-between border-b py-2 text-sm hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <span className="font-medium text-gray-700">{t.topicTitle}</span>
                <span className="text-red-600 font-bold">{t.pct}%</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
