import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { aggregateTopicScores } from '@/lib/diagnosticGrading'
import TestTitleEditor from '@/components/diagnostic/TestTitleEditor'
import StudentResultsTable, { type StudentResultRow } from '@/components/diagnostic/StudentResultsTable'
import PublishToClass from '@/components/diagnostic/PublishToClass'

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

  const { data: classes } = await admin.from('classes').select('id, title').order('order_index')

  const { data: attempts } = await admin
    .from('diagnostic_attempts')
    .select('id, lead_id, status, started_at, submitted_at, correct_count, total_count, score_pct')
    .eq('diagnostic_test_id', testId)
    .eq('status', 'completed')
    .order('submitted_at', { ascending: false })

  const leadIds = [...new Set((attempts ?? []).map(a => a.lead_id))]
  const { data: leads } = leadIds.length > 0
    ? await admin.from('diagnostic_leads').select('id, student_name, student_email, parent_name, parent_email, parent_phone').in('id', leadIds)
    : { data: [] as { id: string; student_name: string; student_email: string; parent_name: string; parent_email: string; parent_phone: string }[] }
  const leadById = new Map((leads ?? []).map(l => [l.id, l]))

  const n = attempts?.length ?? 0
  const avgPct = n > 0 ? Math.round((attempts ?? []).reduce((sum, a) => sum + (a.score_pct ?? 0), 0) / n) : 0

  // Class Struggles: aggregate across every completed attempt's answers for
  // this test, using the same aggregateTopicScores() a single attempt's
  // breakdown uses — no separate aggregation logic to maintain.
  const attemptIds = (attempts ?? []).map(a => a.id)
  const { data: answers } = attemptIds.length > 0
    ? await admin.from('diagnostic_attempt_answers').select('question_id, is_correct').in('attempt_id', attemptIds)
    : { data: [] as { question_id: string; is_correct: boolean }[] }
  const questionIds = [...new Set((answers ?? []).map(a => a.question_id))]
  const { data: questions } = questionIds.length > 0
    ? await admin.from('diagnostic_questions').select('id, topic_id').in('id', questionIds)
    : { data: [] as { id: string; topic_id: string }[] }
  const topicIdByQuestion = new Map((questions ?? []).map(q => [q.id, q.topic_id]))
  const topicIds = [...new Set((questions ?? []).map(q => q.topic_id))]
  const { data: topics } = topicIds.length > 0
    ? await admin.from('diagnostic_topics').select('id, title').in('id', topicIds)
    : { data: [] as { id: string; title: string }[] }
  const topicTitleById = new Map((topics ?? []).map(t => [t.id, t.title]))

  const classStruggleRows = (answers ?? [])
    .map(a => {
      const topicId = topicIdByQuestion.get(a.question_id)
      if (!topicId) return null
      return { topicId, topicTitle: topicTitleById.get(topicId) ?? 'Unknown', isCorrect: a.is_correct }
    })
    .filter((r): r is { topicId: string; topicTitle: string; isCorrect: boolean } => r !== null)
  const classStruggles = aggregateTopicScores(classStruggleRows).filter(t => t.tier !== 'mastered')

  const studentRows: StudentResultRow[] = (attempts ?? []).map(a => {
    const lead = leadById.get(a.lead_id)
    return {
      attemptId: a.id,
      leadId: a.lead_id,
      studentName: lead?.student_name ?? 'Unknown',
      studentEmail: lead?.student_email ?? '',
      parentName: lead?.parent_name ?? '',
      parentPhone: lead?.parent_phone ?? '',
      correctCount: a.correct_count,
      totalCount: a.total_count,
      scorePct: a.score_pct,
      timeSpentMinutes: a.submitted_at ? Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 60000) : 0,
      submittedAt: a.submitted_at,
    }
  })

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/teacher/diagnostics" className="text-blue-600 text-sm hover:underline block mb-2">← All Tests</Link>
      <div className="flex items-center justify-between mb-1">
        <TestTitleEditor testId={testId} title={test.title} description={test.description} />
        <div className="flex gap-2">
          <Link href={`/teacher/diagnostics/${testId}/topics`} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition">Manage Topics</Link>
          <Link href={`/teacher/diagnostics/${testId}/questions`} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition">Manage Questions</Link>
        </div>
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
              <div key={t.topicId} className="flex justify-between border-b py-2 text-sm">
                <span className="font-medium text-gray-700">{t.topicTitle}</span>
                <span className="text-red-600 font-bold">{t.pct}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
