import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import StudentAssignMatrix from './StudentAssignMatrix'

export default async function AssignStudentsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createAdminClient()

  const [{ data: cls }, { data: students }, { data: units }] = await Promise.all([
    supabase.from('classes').select('id, title').eq('id', classId).single(),
    supabase.from('profiles').select('id, full_name, avatar_url, nickname').eq('class_id', classId).eq('role', 'student').eq('approved', true).order('full_name'),
    supabase.from('units').select('id, title, order_index').eq('class_id', classId).order('order_index'),
  ])

  if (!cls) notFound()

  const unitIds = units?.map(u => u.id) ?? []
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, title, unit_id, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }

  const topicIds = topics?.map(t => t.id) ?? []
  const { data: questions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, title, topic_id, order_index').in('topic_id', topicIds).order('order_index')
    : { data: [] }

  const questionIds = questions?.map((q: { id: string }) => q.id) ?? []
  const studentIds = students?.map(s => s.id) ?? []

  // Existing student-level assignments for this class's students
  const { data: studentAssignments } = questionIds.length > 0 && studentIds.length > 0
    ? await supabase.from('student_assignments').select('student_id, question_id, due_date').in('student_id', studentIds).in('question_id', questionIds)
    : { data: [] }

  return (
    <div className="max-w-full">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/teacher/class/${classId}`} className="text-purple-600 text-sm hover:underline">← {cls.title}</Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-xl font-bold text-gray-900">Assign to Students</h1>
      </div>

      {students && students.length === 0 && (
        <p className="text-gray-500">No students enrolled in this class yet.</p>
      )}

      {questions && questions.length === 0 && (
        <p className="text-gray-500">No questions yet. <Link href="/teacher/content" className="text-purple-600 underline">Add content →</Link></p>
      )}

      {students && students.length > 0 && questions && questions.length > 0 && (
        <StudentAssignMatrix
          classId={classId}
          students={students}
          units={units ?? []}
          topics={topics ?? []}
          questions={questions ?? []}
          initialAssignments={studentAssignments ?? []}
        />
      )}
    </div>
  )
}
