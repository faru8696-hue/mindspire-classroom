import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SelfCheckSession, { SessionQuestion } from '@/components/SelfCheckSession'

export default async function ReviewFolderPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: flags } = await supabase
    .from('review_flags')
    .select('question_id')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
  const questionIds = (flags ?? []).map(f => f.question_id)

  const { data: questions } = questionIds.length > 0
    ? await supabase.from('questions').select('id, title, content, answer_key, difficulty, points, question_type, mcq_options').in('id', questionIds)
    : { data: [] }
  const byId = new Map((questions ?? []).map(q => [q.id, q]))
  const ordered: SessionQuestion[] = questionIds
    .map(id => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => !!q)
    .map(q => ({ ...q, flagged: true }))

  return (
    <SelfCheckSession
      questions={ordered}
      testId={null}
      backHref={`/student/${classId}/practice`}
      doneHref={`/student/${classId}/practice`}
    />
  )
}
