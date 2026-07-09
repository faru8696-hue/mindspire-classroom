import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LiveClassroomView from './LiveClassroomView'

export default async function LiveClassroomPage({
  params, searchParams,
}: {
  params: Promise<{ classId: string; questionId: string }>
  searchParams: Promise<{ comment?: string }>
}) {
  const { classId, questionId } = await params
  const { comment: autoOpenCommentsStudentId } = await searchParams
  const supabase = await createAdminClient()

  const [{ data: cls }, { data: question }, { data: enrollments }, { data: units }] = await Promise.all([
    supabase.from('classes').select('title').eq('id', classId).single(),
    supabase.from('questions').select('title, content').eq('id', questionId).single(),
    supabase.from('class_enrollments').select('student_id').eq('class_id', classId),
    supabase.from('units').select('id, title, order_index').eq('class_id', classId),
  ])

  if (!cls || !question) notFound()

  // All questions in this class (class → units → topics → questions), ordered
  const unitIds = (units ?? []).map(u => u.id)
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, title, unit_id, order_index').in('unit_id', unitIds)
    : { data: [] as { id: string; title: string; unit_id: string; order_index: number }[] }
  const topicIds = (topics ?? []).map(t => t.id)
  const { data: classQuestions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, title, topic_id, order_index').in('topic_id', topicIds)
    : { data: [] as { id: string; title: string; topic_id: string; order_index: number }[] }

  const unitOrder = new Map((units ?? []).map(u => [u.id, u.order_index ?? 0]))
  const topicById = new Map((topics ?? []).map(t => [t.id, t]))
  const allQuestions = (classQuestions ?? [])
    .map(q => {
      const t = topicById.get(q.topic_id)
      return {
        id: q.id,
        title: q.title,
        topicTitle: t?.title ?? '',
        _u: t ? (unitOrder.get(t.unit_id) ?? 0) : 0,
        _t: t?.order_index ?? 0,
        _q: q.order_index ?? 0,
      }
    })
    .sort((a, b) => a._u - b._u || a._t - b._t || a._q - b._q)
    .map(({ id, title, topicTitle }) => ({ id, title, topicTitle }))

  // Unread help counts per question across the whole class
  const { data: classHelp } = await supabase
    .from('notifications')
    .select('question_id, type, read')
    .eq('class_id', classId)
    .eq('type', 'help')
    .eq('read', false)
  const questionHelp: Record<string, number> = {}
  for (const n of classHelp ?? []) questionHelp[n.question_id] = (questionHelp[n.question_id] ?? 0) + 1

  const enrolledIds = enrollments?.map(e => e.student_id) ?? []
  const { data: students } = enrolledIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', enrolledIds).eq('role', 'student').eq('approved', true).order('full_name')
    : { data: [] }

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
    .select('id, type, student_id, question_id, class_id, created_at, read')
    .eq('question_id', questionId)
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  // Comments for this question across all students in the class — students
  // sometimes type their actual answer into the comment box instead of
  // drawing/submitting, so the teacher needs to see this on the grid tile
  // without opening each student's board individually.
  const { data: comments } = studentIds.length > 0
    ? await supabase
        .from('comments')
        .select('id, student_id, author_id, message, created_at, author:profiles!comments_author_id_fkey(role)')
        .eq('question_id', questionId)
        .in('student_id', studentIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  const { data: teacherProfile } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher').limit(1).single()

  return (
    <LiveClassroomView
      classId={classId}
      questionId={questionId}
      classTitle={cls.title}
      questionTitle={question.title}
      questionContent={question.content}
      allQuestions={allQuestions}
      questionHelp={questionHelp}
      students={students ?? []}
      initialSubmissions={(submissions ?? []).map((s: { id: string; student_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }) => s)}
      initialFeedbacks={(feedbacks ?? []).map((f: { submission_id: string; grade: string | null }) => f)}
      initialNotifications={(notifications ?? []).map((n: { id: string; type: string; student_id: string; question_id: string; class_id: string; created_at: string; read: boolean }) => n)}
      initialComments={(comments ?? []).map((c: unknown) => {
        const row = c as { id: string; student_id: string; author_id: string; message: string; created_at: string; author: { role: string } | { role: string }[] | null }
        const role = Array.isArray(row.author) ? row.author[0]?.role : row.author?.role
        return { id: row.id, student_id: row.student_id, author_id: row.author_id, message: row.message, created_at: row.created_at, authorRole: role ?? '' }
      })}
      teacherId={teacherProfile?.id ?? ''}
      teacherName={teacherProfile?.full_name ?? 'Teacher'}
      autoOpenCommentsStudentId={autoOpenCommentsStudentId ?? null}
    />
  )
}
