import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SchoolTopicsChecklist from './SchoolTopicsChecklist'

export default async function SchoolTopicsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const studentId = user.id

  // Fallback if the in_group migration hasn't run yet — treat everyone as
  // in-group, same defensive pattern used elsewhere in this feature.
  const { data: enrollmentsFull, error: enrollErr } = await supabase
    .from('class_enrollments').select('class_id, in_group').eq('student_id', studentId)
  const enrollments: { class_id: string; in_group?: boolean }[] = enrollErr
    ? ((await supabase.from('class_enrollments').select('class_id').eq('student_id', studentId)).data ?? [])
    : (enrollmentsFull ?? [])
  const classIds = enrollments.filter(e => e.in_group !== false).map(e => e.class_id)

  if (classIds.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-purple-900 mb-2">School Topics</h1>
        <p className="text-gray-500">
          {enrollments.length === 0 ? "You're not enrolled in a class yet." : 'Nothing to fill in here right now.'}
        </p>
      </div>
    )
  }

  const [{ data: classes }, { data: units }, { data: plans }] = await Promise.all([
    supabase.from('classes').select('id, title, order_index').in('id', classIds).order('order_index'),
    supabase.from('units').select('id, class_id, title, order_index').in('class_id', classIds).order('order_index'),
    supabase.from('student_topic_plans').select('topic_id, test_date').eq('student_id', studentId),
  ])

  const unitIds = (units ?? []).map((u: { id: string }) => u.id)
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, unit_id, title, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }

  // Fetched separately with a fallback: starts_on requires a migration that
  // may not have run yet, and a missing column would otherwise fail the
  // whole select and wipe out not_started/other_topics too.
  const { data: statusRowsFull, error: statusErr } = await supabase
    .from('student_school_status').select('class_id, not_started, starts_on, other_topics').eq('student_id', studentId)
  const statusRows = statusErr
    ? (await supabase.from('student_school_status').select('class_id, not_started, other_topics').eq('student_id', studentId)).data
    : statusRowsFull

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-1">School Topics</h1>
      <p className="text-sm text-gray-500 mb-6">
        Optional — check off what your school is currently teaching (or has already taught) for each class, and add your school&apos;s test date if you know it. This helps your teacher plan group sessions around what everyone actually needs, but it&apos;s not required.
      </p>
      <SchoolTopicsChecklist
        studentId={studentId}
        classes={classes ?? []}
        units={units ?? []}
        topics={topics ?? []}
        initialPlans={(plans ?? []).map((p: { topic_id: string; test_date: string | null }) => ({ topicId: p.topic_id, testDate: p.test_date }))}
        initialStatus={(statusRows ?? []).map((s: { class_id: string; not_started: boolean; starts_on?: string | null; other_topics: string | null }) => ({
          classId: s.class_id, notStarted: s.not_started, startsOn: s.starts_on ?? null, otherTopics: s.other_topics ?? '',
        }))}
      />
    </div>
  )
}
