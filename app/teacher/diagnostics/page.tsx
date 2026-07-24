import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DiagnosticsListPage() {
  const admin = await createAdminClient()

  const { data: tests } = await admin
    .from('diagnostic_tests')
    .select('id, slug, title, is_active, created_at')
    .order('created_at', { ascending: false })

  const testIds = (tests ?? []).map(t => t.id)
  const [{ data: questionCounts }, { data: attemptCounts }] = await Promise.all([
    testIds.length > 0
      ? admin.from('diagnostic_questions').select('diagnostic_test_id').in('diagnostic_test_id', testIds).eq('is_active', true)
      : Promise.resolve({ data: [] as { diagnostic_test_id: string }[] }),
    testIds.length > 0
      ? admin.from('diagnostic_attempts').select('diagnostic_test_id').in('diagnostic_test_id', testIds).eq('status', 'completed')
      : Promise.resolve({ data: [] as { diagnostic_test_id: string }[] }),
  ])
  const questionCountByTest = new Map<string, number>()
  for (const q of questionCounts ?? []) questionCountByTest.set(q.diagnostic_test_id, (questionCountByTest.get(q.diagnostic_test_id) ?? 0) + 1)
  const attemptCountByTest = new Map<string, number>()
  for (const a of attemptCounts ?? []) attemptCountByTest.set(a.diagnostic_test_id, (attemptCountByTest.get(a.diagnostic_test_id) ?? 0) + 1)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-purple-900">Diagnostic Tests</h1>
        <Link href="/teacher/diagnostics/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
          + New Diagnostic Test
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">Public, free diagnostic tests — no login or enrollment required to take them.</p>

      {!tests?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🧪</div>
          <p className="text-gray-500">No diagnostic tests yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tests.map(t => (
            <Link
              key={t.id}
              href={`/teacher/diagnostics/${t.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-300 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                  {!t.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold">INACTIVE</span>}
                </div>
                <p className="text-xs text-gray-400">/diagnostic/{t.slug}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">{questionCountByTest.get(t.id) ?? 0} questions · {attemptCountByTest.get(t.id) ?? 0} attempts</p>
                <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
