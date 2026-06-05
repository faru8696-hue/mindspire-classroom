import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QuestionResultsView from './QuestionResultsView'

export default async function QuestionResultsPage({
  params,
}: {
  params: Promise<{ questionId: string }>
}) {
  const { questionId } = await params
  const supabase = await createAdminClient()

  // Resolve question → topic → unit → class
  const { data: question } = await supabase
    .from('questions')
    .select('id, title, content, topic_id, order_index')
    .eq('id', questionId)
    .single()
  if (!question) notFound()

  const { data: topic } = await supabase
    .from('topics')
    .select('id, title, unit_id')
    .eq('id', question.topic_id)
    .single()
  if (!topic) notFound()

  const { data: unit } = await supabase
    .from('units')
    .select('id, title, class_id')
    .eq('id', topic.unit_id)
    .single()
  if (!unit) notFound()

  const { data: cls } = await supabase
    .from('classes')
    .select('id, title')
    .eq('id', unit.class_id)
    .single()
  if (!cls) notFound()

  // All questions in this topic (parts of the same problem)
  const { data: allParts } = await supabase
    .from('questions')
    .select('id, title, content, order_index')
    .eq('topic_id', topic.id)
    .order('order_index')

  const parts = allParts ?? []

  // All enrolled students for this class
  const { data: enrollments } = await supabase
    .from('class_enrollments')
    .select('student_id')
    .eq('class_id', cls.id)

  const enrolledIds = enrollments?.map(e => e.student_id) ?? []
  const { data: students } = enrolledIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, nickname')
        .in('id', enrolledIds)
        .eq('role', 'student')
        .eq('approved', true)
        .order('full_name')
    : { data: [] as { id: string; full_name: string; avatar_url: string | null; nickname: string | null }[] }

  const studentList = students ?? []
  const studentIds = studentList.map(s => s.id)

  // Submissions for ALL parts in this topic (so we can show per-part)
  const partIds = parts.map(p => p.id)
  const { data: submissions } = studentIds.length > 0 && partIds.length > 0
    ? await supabase
        .from('submissions')
        .select('id, student_id, question_id, canvas_data, text_answer, updated_at')
        .in('student_id', studentIds)
        .in('question_id', partIds)
    : { data: [] as { id: string; student_id: string; question_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }[] }

  const subList = submissions ?? []
  const subIds = subList.map(s => s.id)
  const { data: feedbacks } = subIds.length > 0
    ? await supabase
        .from('feedback')
        .select('submission_id, grade')
        .in('submission_id', subIds)
    : { data: [] as { submission_id: string; grade: string | null }[] }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <Link href="/teacher" className="hover:text-purple-600">Dashboard</Link>
        <span>›</span>
        <Link href={`/teacher/class/${cls.id}`} className="hover:text-purple-600">{cls.title}</Link>
        <span>›</span>
        <span className="text-gray-400">{unit.title}</span>
        <span>›</span>
        <span className="text-gray-700 font-medium">{topic.title}</span>
      </div>

      <QuestionResultsView
        classId={cls.id}
        classTitle={cls.title}
        topic={{ id: topic.id, title: topic.title }}
        parts={parts}
        activeQuestionId={questionId}
        students={studentList}
        submissions={subList}
        feedbacks={feedbacks ?? []}
      />
    </div>
  )
}
