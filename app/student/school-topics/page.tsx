import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SchoolTopicsChecklist from './SchoolTopicsChecklist'

export default async function SchoolTopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>
}) {
  const { required } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const studentId = user.id

  const { data: enrollments } = await supabase.from('class_enrollments').select('class_id').eq('student_id', studentId)
  const classIds = (enrollments ?? []).map((e: { class_id: string }) => e.class_id)

  if (classIds.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-purple-900 mb-2">School Topics</h1>
        <p className="text-gray-500">You&apos;re not enrolled in a class yet.</p>
      </div>
    )
  }

  const [{ data: classes }, { data: units }, { data: plans }, { data: statusRows }] = await Promise.all([
    supabase.from('classes').select('id, title, order_index').in('id', classIds).order('order_index'),
    supabase.from('units').select('id, class_id, title, order_index').in('class_id', classIds).order('order_index'),
    supabase.from('student_topic_plans').select('topic_id, test_date').eq('student_id', studentId),
    supabase.from('student_school_status').select('class_id, not_started, other_topics').eq('student_id', studentId),
  ])

  const unitIds = (units ?? []).map((u: { id: string }) => u.id)
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, unit_id, title, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }

  return (
    <div className="max-w-3xl mx-auto">
      {required === '1' && (
        <div className="mb-5 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium">
          📋 Please tell us what your school is covering before continuing — for each class, check off topics, or let us know if your school hasn&apos;t started it yet.
        </div>
      )}
      <h1 className="text-2xl font-bold text-purple-900 mb-1">School Topics</h1>
      <p className="text-sm text-gray-500 mb-6">
        Check off what your school is currently teaching (or has already taught) for each class, and add your school&apos;s test date if you know it. This helps your teacher plan group sessions around what everyone actually needs.
      </p>
      <SchoolTopicsChecklist
        studentId={studentId}
        classes={classes ?? []}
        units={units ?? []}
        topics={topics ?? []}
        initialPlans={(plans ?? []).map((p: { topic_id: string; test_date: string | null }) => ({ topicId: p.topic_id, testDate: p.test_date }))}
        initialStatus={(statusRows ?? []).map((s: { class_id: string; not_started: boolean; other_topics: string | null }) => ({
          classId: s.class_id, notStarted: s.not_started, otherTopics: s.other_topics ?? '',
        }))}
        required={required === '1'}
      />
    </div>
  )
}
