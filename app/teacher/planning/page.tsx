import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

// Faridah's fixed weekly group-session schedule — not tied to any DB table
// since it's a single constant shared by both classes, not something that
// currently varies per class or student.
const CLASS_DAYS = ['Tuesday', 'Saturday', 'Sunday']

export default async function TeacherPlanningPage() {
  const supabase = await createAdminClient()

  const { data: classes } = await supabase.from('classes').select('id, title, order_index').order('order_index')
  const classIds = (classes ?? []).map((c: { id: string }) => c.id)

  const [{ data: units }, { data: enrollments }, { data: plans }] = await Promise.all([
    classIds.length > 0
      ? supabase.from('units').select('id, class_id, title, order_index').in('class_id', classIds).order('order_index')
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('class_enrollments').select('student_id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('student_topic_plans').select('student_id, class_id, topic_id, test_date').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
  ])

  const unitIds = (units ?? []).map((u: { id: string }) => u.id)
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, unit_id, title, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }

  const enrolledCountByClass = new Map<string, number>()
  for (const e of enrollments ?? []) {
    enrolledCountByClass.set(e.class_id, (enrolledCountByClass.get(e.class_id) ?? 0) + 1)
  }

  // How many students report a topic as taught, how many attached a test
  // date, and the earliest of those dates (worth flagging first).
  const planCountByTopic = new Map<string, number>()
  const testDateCountByTopic = new Map<string, number>()
  const nearestTestDateByTopic = new Map<string, string>()
  for (const p of plans ?? []) {
    planCountByTopic.set(p.topic_id, (planCountByTopic.get(p.topic_id) ?? 0) + 1)
    if (p.test_date) {
      testDateCountByTopic.set(p.topic_id, (testDateCountByTopic.get(p.topic_id) ?? 0) + 1)
      const current = nearestTestDateByTopic.get(p.topic_id)
      if (!current || p.test_date < current) nearestTestDateByTopic.set(p.topic_id, p.test_date)
    }
  }

  const topicById = new Map((topics ?? []).map((t: { id: string; title: string }) => [t.id, t]))

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">Planning</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Based on what students report their own school is teaching. Group sessions meet {CLASS_DAYS.join(' · ')}.
          </p>
        </div>
        <Link href="/teacher" className="text-purple-600 text-sm hover:underline">← Dashboard</Link>
      </div>

      {(classes ?? []).map(cls => {
        const classUnits = (units ?? []).filter((u: { class_id: string }) => u.class_id === cls.id)
          .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        const classTopicIds = new Set(
          classUnits.flatMap((u: { id: string }) => (topics ?? []).filter((t: { unit_id: string }) => t.unit_id === u.id).map((t: { id: string }) => t.id))
        )
        const totalStudents = enrolledCountByClass.get(cls.id) ?? 0

        const upcoming = [...classTopicIds]
          .filter(tid => nearestTestDateByTopic.has(tid as string))
          .map(tid => ({
            topicId: tid as string,
            title: topicById.get(tid as string)?.title ?? '',
            date: nearestTestDateByTopic.get(tid as string)!,
            count: testDateCountByTopic.get(tid as string) ?? 0,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        return (
          <section key={cls.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-800">{cls.title}</h2>
              <span className="text-xs text-gray-500">{totalStudents} student{totalStudents === 1 ? '' : 's'} enrolled</span>
            </div>

            {totalStudents === 0 ? (
              <p className="text-gray-400 text-sm">No students enrolled.</p>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
                    <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                      <span className="text-sm font-semibold text-amber-800">📅 Upcoming Tests</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {upcoming.map(u => (
                        <div key={u.topicId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-gray-800">{u.title}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{u.count}/{totalStudents} students</span>
                            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{u.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {classUnits.length === 0 && <p className="text-sm text-gray-400 px-5 py-4">No curriculum content yet.</p>}
                  {classUnits.map((unit: { id: string; title: string }) => {
                    const unitTopics = (topics ?? []).filter((t: { unit_id: string }) => t.unit_id === unit.id)
                      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
                    if (unitTopics.length === 0) return null
                    return (
                      <div key={unit.id} className="border-b border-gray-100 last:border-0">
                        <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">{unit.title}</p>
                        {unitTopics.map((topic: { id: string; title: string }) => {
                          const count = planCountByTopic.get(topic.id) ?? 0
                          const nearestDate = nearestTestDateByTopic.get(topic.id)
                          return (
                            <div key={topic.id} className="flex items-center justify-between px-5 py-2 text-sm">
                              <span className="text-gray-700">{topic.title}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${count > 0 ? 'text-purple-700 font-semibold' : 'text-gray-300'}`}>
                                  {count}/{totalStudents} reported taught
                                </span>
                                {nearestDate && (
                                  <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{nearestDate}</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </section>
        )
      })}

      {(classes ?? []).length === 0 && <p className="text-gray-500">No classes yet.</p>}
    </div>
  )
}
