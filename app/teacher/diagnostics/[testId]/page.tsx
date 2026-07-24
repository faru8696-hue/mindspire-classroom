import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { aggregateTopicScores } from '@/lib/diagnosticGrading'

export default async function DiagnosticTestDashboardPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const { testId } = await params
  const admin = await createAdminClient()

  const { data: test } = await admin
    .from('diagnostic_tests')
    .select('id, title, slug, description, question_count_per_attempt, duration_minutes, is_active')
    .eq('id', testId)
    .maybeSingle()
  if (!test) notFound()

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

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/teacher/diagnostics" className="text-blue-600 text-sm hover:underline block mb-2">← All diagnostic tests</Link>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">{test.title}</h1>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">Mindspire Lab</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/diagnostics/${testId}/topics`} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition">Manage Topics</Link>
          <Link href={`/teacher/diagnostics/${testId}/questions`} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition">Manage Questions</Link>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Public link: <a href={`/diagnostic/${test.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">/diagnostic/{test.slug}</a>
      </p>

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
          {n === 0 ? (
            <p className="text-gray-400 text-center py-8">No students have completed the test yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-400 text-xs uppercase tracking-wide">
                  <th className="pb-2 px-3">Name</th>
                  <th className="pb-2 px-3">Contact</th>
                  <th className="pb-2 px-3">Score</th>
                  <th className="pb-2 px-3">Time</th>
                  <th className="pb-2 px-3">Date</th>
                  <th className="pb-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {(attempts ?? []).map(a => {
                  const lead = leadById.get(a.lead_id)
                  const pct = a.score_pct ?? 0
                  const colorCls = pct >= 80 ? 'text-green-600 font-bold' : pct >= 50 ? 'text-yellow-600 font-bold' : 'text-red-600 font-bold'
                  const timeSpent = a.submitted_at ? Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 60000) : 0
                  return (
                    <tr key={a.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">{lead?.student_name ?? 'Unknown'}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs">
                        {lead?.student_email}<br />
                        <span className="text-gray-400">Parent: {lead?.parent_name} · {lead?.parent_phone}</span>
                      </td>
                      <td className={`py-3 px-3 ${colorCls}`}>{a.correct_count}/{a.total_count} ({pct}%)</td>
                      <td className="py-3 px-3 text-gray-500 text-xs">{timeSpent}m</td>
                      <td className="py-3 px-3 text-gray-400 text-xs">{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : ''}</td>
                      <td className="py-3 px-3">
                        <Link href={`/teacher/diagnostics/${testId}/attempts/${a.id}`} className="text-indigo-600 text-xs font-semibold hover:underline">View →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
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
