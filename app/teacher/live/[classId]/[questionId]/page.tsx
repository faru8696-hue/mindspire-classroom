import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LiveClassroomView from './LiveClassroomView'

export default async function LiveClassroomPage({ params }: { params: Promise<{ classId: string; questionId: string }> }) {
  const { classId, questionId } = await params
  const supabase = await createAdminClient()

  const [{ data: cls }, { data: question }, { data: students }] = await Promise.all([
    supabase.from('classes').select('title').eq('id', classId).single(),
    supabase.from('questions').select('title, content').eq('id', questionId).single(),
    supabase.from('profiles').select('id, full_name').eq('class_id', classId).eq('role', 'student').eq('approved', true).order('full_name'),
  ])

  if (!cls || !question) notFound()

  const studentIds = students?.map(s => s.id) ?? []
  const { data: submissions } = studentIds.length > 0
    ? await supabase.from('submissions').select('id, student_id, canvas_data, text_answer, updated_at').eq('question_id', questionId).in('student_id', studentIds)
    : { data: [] }

  const submissionIds = submissions?.map((s: { id: string }) => s.id) ?? []
  const { data: feedbacks } = submissionIds.length > 0
    ? await supabase.from('feedback').select('submission_id, grade').in('submission_id', submissionIds)
    : { data: [] }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, student_id, created_at, read')
    .eq('question_id', questionId)
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  return (
    <LiveClassroomView
      classId={classId}
      questionId={questionId}
      classTitle={cls.title}
      questionTitle={question.title}
      questionContent={question.content}
      students={students ?? []}
      initialSubmissions={(submissions ?? []).map((s: { id: string; student_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }) => s)}
      initialFeedbacks={(feedbacks ?? []).map((f: { submission_id: string; grade: string | null }) => f)}
      initialNotifications={(notifications ?? []).map((n: { id: string; type: string; student_id: string; created_at: string; read: boolean }) => n)}
    />
  )
}
