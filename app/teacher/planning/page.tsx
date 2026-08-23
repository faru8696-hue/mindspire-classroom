import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MarkNavSeen from '@/components/MarkNavSeen'
import TestDateCalendar, { type CalendarEvent } from './TestDateCalendar'
import WeeklyPlanButton from './WeeklyPlanButton'
import RosterManager, { type RosterStudent } from './RosterManager'
import { CLASS_DAYS } from '@/lib/classSchedule'

export default async function TeacherPlanningPage() {
  const supabase = await createAdminClient()

  const { data: classes } = await supabase.from('classes').select('id, title, order_index').order('order_index')
  const classIds = (classes ?? []).map((c: { id: string }) => c.id)

  // Fetched separately with a fallback: in_group requires a migration that
  // may not have run yet, and a missing column would otherwise fail the
  // whole select.
  const { data: enrollmentsFull, error: enrollErr } = classIds.length > 0
    ? await supabase.from('class_enrollments').select('student_id, class_id, in_group').in('class_id', classIds)
    : { data: [], error: null }
  const enrollments: { student_id: string; class_id: string; in_group?: boolean }[] = enrollErr
    ? ((await supabase.from('class_enrollments').select('student_id, class_id').in('class_id', classIds)).data ?? [])
    : (enrollmentsFull ?? [])

  const [{ data: units }, { data: plans }, { data: statusRows }] = await Promise.all([
    classIds.length > 0
      ? supabase.from('units').select('id, class_id, title, order_index').in('class_id', classIds).order('order_index')
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('student_topic_plans').select('student_id, class_id, topic_id, test_date').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('student_school_status').select('student_id, class_id, not_started, starts_on, other_topics').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
  ])

  // Students marked not-in-group are excluded from every planning
  // aggregate below (counts, calendar, AI input) but their raw rows are
  // never touched — flip the toggle back and they're counted again.
  const inGroupStudentIdsByClass = new Map<string, Set<string>>()
  for (const e of enrollments) {
    if (e.in_group === false) continue
    if (!inGroupStudentIdsByClass.has(e.class_id)) inGroupStudentIdsByClass.set(e.class_id, new Set())
    inGroupStudentIdsByClass.get(e.class_id)!.add(e.student_id)
  }
  const isInGroup = (classId: string, studentId: string) => inGroupStudentIdsByClass.get(classId)?.has(studentId) ?? false

  const unitIds = (units ?? []).map((u: { id: string }) => u.id)
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, unit_id, title, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }
  const topicTitleById = new Map((topics ?? []).map((t: { id: string; title: string }) => [t.id, t.title]))

  const enrolledStudentIds = [...new Set(enrollments.map(e => e.student_id))]
  const { data: studentProfiles } = enrolledStudentIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', enrolledStudentIds)
    : { data: [] }
  const nameById = new Map((studentProfiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]))

  // Full roster per class (group AND non-group) for the roster-manager
  // panel — the aggregates below filter to group-only, but this list needs
  // everyone so the teacher can flip someone back in, and includes each
  // student's actual responses so individual entries can be deleted there.
  const rosterByClass = new Map<string, RosterStudent[]>()
  const statusRowsTyped = (statusRows ?? []) as { student_id: string; class_id: string; not_started: boolean; starts_on: string | null; other_topics: string | null }[]
  for (const e of enrollments) {
    if (!rosterByClass.has(e.class_id)) rosterByClass.set(e.class_id, [])
    const studentPlans = (plans ?? [])
      .filter((p: { student_id: string; class_id: string }) => p.student_id === e.student_id && p.class_id === e.class_id)
      .map((p: { topic_id: string; test_date: string | null }) => ({ topicId: p.topic_id, topicTitle: topicTitleById.get(p.topic_id) ?? '', testDate: p.test_date }))
    const status = statusRowsTyped.find(s => s.student_id === e.student_id && s.class_id === e.class_id)
    rosterByClass.get(e.class_id)!.push({
      id: e.student_id,
      name: nameById.get(e.student_id) ?? 'Unknown',
      inGroup: e.in_group !== false,
      topics: studentPlans,
      notStarted: status?.not_started ?? false,
      startsOn: status?.starts_on ?? null,
      otherTopics: status?.other_topics ?? null,
    })
  }
  for (const list of rosterByClass.values()) list.sort((a, b) => a.name.localeCompare(b.name))

  // Students who report their school hasn't started a class yet, and any
  // freeform "other topics" notes — both keyed by class so they render
  // alongside that class's topic breakdown below. Excludes non-group
  // students, same as every other aggregate on this page.
  const notStartedByClass = new Map<string, string[]>()
  const otherNotesByClass = new Map<string, { name: string; text: string }[]>()
  for (const s of statusRows ?? []) {
    if (!isInGroup(s.class_id, s.student_id)) continue
    const name = nameById.get(s.student_id) ?? 'Unknown'
    if (s.not_started) {
      if (!notStartedByClass.has(s.class_id)) notStartedByClass.set(s.class_id, [])
      notStartedByClass.get(s.class_id)!.push(name)
    }
    if (s.other_topics && s.other_topics.trim()) {
      if (!otherNotesByClass.has(s.class_id)) otherNotesByClass.set(s.class_id, [])
      otherNotesByClass.get(s.class_id)!.push({ name, text: s.other_topics })
    }
  }

  // "Enrolled" here means group-enrolled — the denominator throughout this
  // page is about the group sessions, not raw class_enrollments membership.
  const enrolledCountByClass = new Map<string, number>()
  for (const [classId, ids] of inGroupStudentIdsByClass) enrolledCountByClass.set(classId, ids.size)

  // How many students report a topic as taught, how many attached a test
  // date, and the earliest of those dates (worth flagging first). Non-group
  // students' reports don't factor in here at all.
  const planCountByTopic = new Map<string, number>()
  const testDateCountByTopic = new Map<string, number>()
  const nearestTestDateByTopic = new Map<string, string>()
  for (const p of plans ?? []) {
    if (!isInGroup(p.class_id, p.student_id)) continue
    planCountByTopic.set(p.topic_id, (planCountByTopic.get(p.topic_id) ?? 0) + 1)
    if (p.test_date) {
      testDateCountByTopic.set(p.topic_id, (testDateCountByTopic.get(p.topic_id) ?? 0) + 1)
      const current = nearestTestDateByTopic.get(p.topic_id)
      if (!current || p.test_date < current) nearestTestDateByTopic.set(p.topic_id, p.test_date)
    }
  }

  const classById = new Map((classes ?? []).map((c: { id: string; title: string }) => [c.id, c.title]))

  // Every distinct (date, class, topic) combination — not just the nearest
  // per topic (that's what the "Upcoming Tests" panel below shows) — so the
  // calendar reflects the full spread of dates students actually reported.
  // Non-group students excluded, same as the rest of this page.
  const calendarEventMap = new Map<string, { date: string; classId: string; topicId: string; count: number }>()
  for (const p of plans ?? []) {
    if (!p.test_date || !isInGroup(p.class_id, p.student_id)) continue
    const key = `${p.test_date}|${p.class_id}|${p.topic_id}`
    const cur = calendarEventMap.get(key)
    if (cur) cur.count++
    else calendarEventMap.set(key, { date: p.test_date, classId: p.class_id, topicId: p.topic_id, count: 1 })
  }
  const calendarEvents: CalendarEvent[] = [...calendarEventMap.values()].map(e => ({
    date: e.date,
    classId: e.classId,
    classTitle: classById.get(e.classId) ?? '',
    topicTitle: topicTitleById.get(e.topicId) ?? '',
    count: e.count,
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <MarkNavSeen navKey="planning" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">Planning</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Based on what students report their own school is teaching. Group sessions meet {CLASS_DAYS.join(' · ')}.
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href="/teacher/content" className="text-purple-600 text-sm hover:underline">+ Add topics →</Link>
          <Link href="/teacher" className="text-purple-600 text-sm hover:underline">← Dashboard</Link>
        </div>
      </div>

      {calendarEvents.length > 0 && <TestDateCalendar events={calendarEvents} classDays={CLASS_DAYS} />}

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
            title: topicTitleById.get(tid as string) ?? '',
            date: nearestTestDateByTopic.get(tid as string)!,
            count: testDateCountByTopic.get(tid as string) ?? 0,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))

        const roster = rosterByClass.get(cls.id) ?? []
        const classTopics = classUnits
          .flatMap((u: { id: string }) => (topics ?? []).filter((t: { unit_id: string }) => t.unit_id === u.id))
          .map((t: { id: string; title: string }) => ({ id: t.id, title: t.title }))

        return (
          <section key={cls.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-800">{cls.title}</h2>
              <span className="text-xs text-gray-500">{totalStudents} student{totalStudents === 1 ? '' : 's'} in group</span>
            </div>

            {roster.length > 0 && <RosterManager classId={cls.id} students={roster} classTopics={classTopics} />}

            {totalStudents === 0 ? (
              <p className="text-gray-400 text-sm">No group students enrolled.</p>
            ) : (
              <>
                <WeeklyPlanButton classId={cls.id} />

                {(notStartedByClass.get(cls.id)?.length ?? 0) > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">🚫 Hasn&apos;t Started Yet</span>
                    </div>
                    <div className="px-4 py-2.5 flex flex-wrap gap-2">
                      {notStartedByClass.get(cls.id)!.map(name => (
                        <span key={name} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(otherNotesByClass.get(cls.id)?.length ?? 0) > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
                    <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                      <span className="text-sm font-semibold text-blue-800">💬 Other Notes</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {otherNotesByClass.get(cls.id)!.map((n, i) => (
                        <div key={i} className="px-4 py-2.5 text-sm">
                          <span className="font-medium text-gray-700">{n.name}:</span>{' '}
                          <span className="text-gray-600">{n.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
