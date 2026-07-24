import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddQuestionForm from '@/components/diagnostic/AddQuestionForm'

export default async function DiagnosticQuestionsPage({
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
    .select('id, title')
    .eq('diagnostic_test_id', testId)
    .order('title')

  const { data: questions } = await admin
    .from('diagnostic_questions')
    .select('id, topic_id, content, mcq_options, mcq_correct_index, is_active')
    .eq('diagnostic_test_id', testId)
    .order('created_at', { ascending: false })

  const topicTitleById = new Map((topics ?? []).map(t => [t.id, t.title]))

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href={`/teacher/diagnostics/${testId}`} className="text-blue-600 text-sm hover:underline block">← {test.title}</Link>
      <h1 className="text-xl font-bold text-gray-800">Questions ({questions?.length ?? 0})</h1>

      {(!topics || topics.length === 0) ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Add at least one <Link href={`/teacher/diagnostics/${testId}/topics`} className="underline font-semibold">topic</Link> before adding questions.
        </div>
      ) : (
        <AddQuestionForm diagnosticTestId={testId} topics={topics} />
      )}

      <div className="space-y-2">
        {(questions ?? []).map(q => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {topicTitleById.get(q.topic_id) ?? 'Unknown topic'}
              </span>
              {!q.is_active && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">INACTIVE</span>}
            </div>
            <p className="text-sm text-gray-800 mb-2">{q.content}</p>
            <div className="space-y-1">
              {(q.mcq_options as string[]).map((opt, i) => (
                <div key={i} className={`text-xs px-2 py-1 rounded ${i === q.mcq_correct_index ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-500'}`}>
                  {String.fromCharCode(65 + i)}. {opt}{i === q.mcq_correct_index ? ' ✓' : ''}
                </div>
              ))}
            </div>
          </div>
        ))}
        {(!questions || questions.length === 0) && (
          <p className="text-gray-400 text-center py-8">No questions yet — add one above.</p>
        )}
      </div>
    </div>
  )
}
