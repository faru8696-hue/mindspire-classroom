import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QuestionResultsView from './QuestionResultsView'
import TopicNav from './TopicNav'

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

  // Full unit → topic tree for this class, with each topic's first question id,
  // so the nav dropdowns below can jump straight to any topic (assigned or not)
  // without detouring back through the Content page.
  const { data: allUnits } = await supabase
    .from('units')
    .select('id, title, order_index')
    .eq('class_id', cls.id)
    .order('order_index')

  const allUnitIds = (allUnits ?? []).map(u => u.id)
  const { data: allTopics } = allUnitIds.length > 0
    ? await supabase
        .from('topics')
        .select('id, title, unit_id, order_index')
        .in('unit_id', allUnitIds)
        .order('order_index')
    : { data: [] as { id: string; title: string; unit_id: string; order_index: number }[] }

  const allTopicIds = (allTopics ?? []).map(t => t.id)
  const { data: allTopicQuestions } = allTopicIds.length > 0
    ? await supabase
        .from('questions')
        .select('id, topic_id, order_index')
        .in('topic_id', allTopicIds)
        .order('order_index')
    : { data: [] as { id: string; topic_id: string; order_index: number }[] }

  const firstQuestionByTopic = new Map<string, string>()
  for (const q of allTopicQuestions ?? []) {
    if (!firstQuestionByTopic.has(q.topic_id)) firstQuestionByTopic.set(q.topic_id, q.id)
  }

  const navUnits = (allUnits ?? []).map(u => ({
    id: u.id,
    title: u.title,
    topics: (allTopics ?? [])
      .filter(t => t.unit_id === u.id)
      .map(t => ({ id: t.id, title: t.title, firstQuestionId: firstQuestionByTopic.get(t.id) ?? null })),
  }))

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <Link href="/teacher" className="hover:text-purple-600">Dashboard</Link>
        <span>›</span>
        <Link href={`/teacher/class/${cls.id}`} className="hover:text-purple-600">{cls.title}</Link>
        <span>›</span>
        <TopicNav navUnits={navUnits} currentUnitId={unit.id} currentTopicId={topic.id} />
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
