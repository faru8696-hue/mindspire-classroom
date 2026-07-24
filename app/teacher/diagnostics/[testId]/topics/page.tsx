import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddTopicForm from '@/components/diagnostic/AddTopicForm'

export default async function DiagnosticTopicsPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const { testId } = await params
  const admin = await createAdminClient()

  const { data: test } = await admin.from('diagnostic_tests').select('id, title').eq('id', testId).maybeSingle()
  if (!test) notFound()

  const { data: topics } = await admin
    .from('diagnostic_topics')
    .select('id, title, prep_advice')
    .eq('diagnostic_test_id', testId)
    .order('title')

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href={`/teacher/diagnostics/${testId}`} className="text-blue-600 text-sm hover:underline block">← {test.title}</Link>
      <h1 className="text-xl font-bold text-gray-800">Topics</h1>

      <AddTopicForm diagnosticTestId={testId} />

      <div className="space-y-2">
        {(topics ?? []).map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="font-semibold text-gray-800">{t.title}</p>
            {t.prep_advice && <p className="text-sm text-gray-500 mt-1">{t.prep_advice}</p>}
          </div>
        ))}
        {(!topics || topics.length === 0) && (
          <p className="text-gray-400 text-center py-8">No topics yet — add one above.</p>
        )}
      </div>
    </div>
  )
}
