import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AssignQuestionsPanel from './AssignQuestionsPanel'
import SendRemindersPanel from './SendRemindersPanel'

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createAdminClient()

  const [{ data: cls }, { data: enrollments }, { data: units }] = await Promise.all([
    supabase.from('classes').select('*').eq('id', classId).single(),
    supabase.from('class_enrollments').select('student_id').eq('class_id', classId),
    supabase.from('units').select('id, title, order_index').eq('class_id', classId).order('order_index'),
  ])

  const enrolledIds = enrollments?.map(e => e.student_id) ?? []
  const { data: students } = enrolledIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', enrolledIds).eq('role', 'student').eq('approved', true).order('full_name')
    : { data: [] as { id: string; full_name: string }[] }

  if (!cls) notFound()

  const unitIds = units?.map(u => u.id) ?? []
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, title, unit_id, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }

  const topicIds = topics?.map(t => t.id) ?? []
  const { data: questions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, title, content, topic_id, order_index, source').in('topic_id', topicIds).order('order_index')
    : { data: [] }

  const questionIds = questions?.map(q => q.id) ?? []

  // Existing assignments for this class
  const { data: assignments } = questionIds.length > 0
    ? await supabase.from('assignments').select('question_id, due_date').eq('class_id', classId)
    : { data: [] }

  // Submitted-count per question — just enough context to show alongside
  // each question in the browse tree, without pulling in the full
  // student/grade breakdown (that lives on the Progress page and each
  // student's own page, one click away via nav).
  // Deliberately not also filtering by .in('question_id', questionIds) — as
  // the class's question bank grows, combining that with the student_id
  // filter can build a request URL long enough that PostgREST rejects it
  // outright with a silent 400 (data comes back null, so every "submitted"
  // count would quietly render as 0 instead of surfacing the failure — this
  // exact bug hit the Progress page once the DB crossed ~600 questions). The
  // student_id filter alone keeps this bounded; submittedCounts below only
  // ever gets read for this class's own question ids anyway.
  const studentIds = students?.map(s => s.id) ?? []
  const { data: submissions } = studentIds.length > 0
    ? await supabase.from('submissions').select('question_id, student_id').in('student_id', studentIds)
    : { data: [] as { question_id: string; student_id: string }[] }

  const submittedCounts: Record<string, number> = {}
  for (const s of submissions ?? []) {
    submittedCounts[s.question_id] = (submittedCounts[s.question_id] ?? 0) + 1
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/teacher" className="text-purple-600 text-sm hover:underline">← Dashboard</Link>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">{cls.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students?.length ?? 0} student{(students?.length ?? 0) !== 1 ? 's' : ''} enrolled</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/teacher/progress" className="text-sm text-purple-600 hover:underline font-medium px-2">
            📊 Full progress →
          </Link>
          <Link href={`/teacher/class/${classId}/assign`} className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium">
            Assign to Students →
          </Link>
        </div>
      </div>

      <SendRemindersPanel classId={classId} />

      {/* Units → Topics → Questions: browse, assign, and jump straight into
          watching every student's live board for a question. This replaces
          the old Student Progress table and Topic Breakdown grid on this
          page — that analysis now lives on the Progress page and each
          student's own page (linked above), both one click away. */}
      <section>
        <AssignQuestionsPanel
          classId={classId}
          units={units ?? []}
          topics={topics ?? []}
          questions={questions ?? []}
          initialAssignments={(assignments ?? []).map(a => ({ question_id: a.question_id, due_date: a.due_date ?? null }))}
          submittedCounts={submittedCounts}
          totalStudents={students?.length ?? 0}
        />
      </section>
    </div>
  )
}
