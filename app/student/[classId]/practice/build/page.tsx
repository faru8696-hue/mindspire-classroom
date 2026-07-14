import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import BuildTestForm from './BuildTestForm'

export default async function BuildTestPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cls } = await supabase.from('classes').select('title').eq('id', classId).single()
  // AP Chemistry has been AI-classified by difficulty; Honors Chemistry
  // hasn't (and doesn't need to be), so the test builder shows a simple
  // question-count picker for Honors instead of an easy/medium/hard split.
  const hasDifficulty = !/honors/i.test(cls?.title ?? '')
  const { data: units } = await supabase.from('units').select('id, title, order_index').eq('class_id', classId).order('order_index')
  const unitIds = (units ?? []).map(u => u.id)
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, title, unit_id, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }

  const unitsWithTopics = (units ?? []).map(u => ({
    id: u.id, title: u.title,
    topics: (topics ?? []).filter(t => t.unit_id === u.id).map(t => ({ id: t.id, title: t.title })),
  }))

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/student/${classId}/practice`} className="text-purple-600 text-sm hover:underline mb-4 block">← Back to Self Study</Link>
      <h1 className="text-2xl font-bold text-purple-900 mb-1">Create a Test</h1>
      <p className="text-sm text-gray-500 mb-6">Choose topics and how many questions of each difficulty for {cls?.title}.</p>
      <BuildTestForm classId={classId} unitsWithTopics={unitsWithTopics} hasDifficulty={hasDifficulty} />
    </div>
  )
}
