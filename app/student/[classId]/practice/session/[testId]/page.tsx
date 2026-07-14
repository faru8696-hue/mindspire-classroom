import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import SelfCheckSession, { SessionQuestion } from '@/components/SelfCheckSession'

export default async function PracticeSessionPage({ params }: { params: Promise<{ classId: string; testId: string }> }) {
  const { classId, testId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: test } = await supabase
    .from('practice_tests')
    .select('id, student_id, question_ids, duration_minutes')
    .eq('id', testId)
    .single()
  if (!test || test.student_id !== user.id) notFound()

  type QuestionRow = { id: string; title: string; content: string | null; answer_key: string | null; difficulty: string | null; points: number; question_type: 'frq' | 'mcq'; mcq_options: string[] | null }
  const { data: questions } = test.question_ids.length > 0
    ? await supabase.from('questions').select('id, title, content, answer_key, difficulty, points, question_type, mcq_options').in('id', test.question_ids)
    : { data: [] as QuestionRow[] }
  const { data: flags } = await supabase.from('review_flags').select('question_id').eq('student_id', user.id)
  const flaggedSet = new Set((flags ?? []).map(f => f.question_id))

  const byId = new Map<string, QuestionRow>((questions ?? []).map(q => [q.id, q]))
  const ordered: SessionQuestion[] = (test.question_ids as string[])
    .map((id: string) => byId.get(id))
    .filter((q: QuestionRow | undefined): q is QuestionRow => !!q)
    .map(q => ({ ...q, flagged: flaggedSet.has(q.id) }))

  return (
    <SelfCheckSession
      questions={ordered}
      testId={test.id}
      backHref={`/student/${classId}/practice`}
      doneHref={`/student/${classId}/practice`}
      durationMinutes={test.duration_minutes}
    />
  )
}
