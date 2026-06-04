import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AllProgressPage() {
  const supabase = await createClient()

  const [{ data: classes }, { data: students }] = await Promise.all([
    supabase.from('classes').select('id, title').order('order_index'),
    supabase.from('profiles').select('id, full_name, class_id').eq('role', 'student').eq('approved', true).order('full_name'),
  ])

  const classIds = classes?.map(c => c.id) ?? []

  // Load full content tree
  const { data: units } = classIds.length > 0
    ? await supabase.from('units').select('id, title, class_id').in('class_id', classIds)
    : { data: [] }

  const unitIds = units?.map(u => u.id) ?? []
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, unit_id').in('unit_id', unitIds)
    : { data: [] }

  const topicIds = topics?.map(t => t.id) ?? []
  const { data: questions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, topic_id').in('topic_id', topicIds)
    : { data: [] }

  const questionIds = questions?.map(q => q.id) ?? []

  // Load assignments per class
  const { data: assignments } = classIds.length > 0
    ? await supabase.from('assignments').select('question_id, class_id').in('class_id', classIds)
    : { data: [] }

  // Load all submissions + feedback
  const studentIds = students?.map(s => s.id) ?? []
  const { data: submissions } = studentIds.length > 0 && questionIds.length > 0
    ? await supabase.from('submissions').select('id, student_id, question_id').in('student_id', studentIds).in('question_id', questionIds)
    : { data: [] }

  const submissionIds = submissions?.map(s => s.id) ?? []
  const { data: feedbacks } = submissionIds.length > 0
    ? await supabase.from('feedback').select('submission_id, grade').in('submission_id', submissionIds)
    : { data: [] }

  // Build lookups
  const gradeBySubmission = new Map(feedbacks?.map(f => [f.submission_id, f.grade as string]))
  // key: `${studentId}:${questionId}` → grade or 'submitted'
  const progressMap = new Map<string, string>()
  for (const sub of submissions ?? []) {
    progressMap.set(`${sub.student_id}:${sub.question_id}`, gradeBySubmission.get(sub.id) ?? 'submitted')
  }

  // Assignments by class: Set per classId
  const assignmentsByClass = new Map<string, Set<string>>()
  for (const a of assignments ?? []) {
    if (!assignmentsByClass.has(a.class_id)) assignmentsByClass.set(a.class_id, new Set())
    assignmentsByClass.get(a.class_id)!.add(a.question_id)
  }

  // Helper: get assigned question ids for a class
  function getAssignedQIds(classId: string) {
    const assigned = assignmentsByClass.get(classId)
    const classUnits = units?.filter(u => u.class_id === classId) ?? []
    const classTopics = topics?.filter(t => classUnits.some(u => u.id === t.unit_id)) ?? []
    const classQIds = questions?.filter(q => classTopics.some(t => t.id === q.topic_id)).map(q => q.id) ?? []
    return assigned && assigned.size > 0 ? classQIds.filter(id => assigned.has(id)) : classQIds
  }

  // Group students by class
  const studentsByClass = new Map<string, typeof students>()
  for (const s of students ?? []) {
    const cid = s.class_id ?? '__none__'
    if (!studentsByClass.has(cid)) studentsByClass.set(cid, [])
    studentsByClass.get(cid)!.push(s)
  }

  // Compute per-student stats
  function getStats(studentId: string, classId: string) {
    const qIds = getAssignedQIds(classId)
    let correct = 0, incorrect = 0, partial = 0, submitted = 0
    for (const qId of qIds) {
      const st = progressMap.get(`${studentId}:${qId}`)
      if (!st) continue
      submitted++
      if (st === 'correct') correct++
      else if (st === 'incorrect') incorrect++
      else if (st === 'partial') partial++
    }
    return { total: qIds.length, submitted, correct, incorrect, partial, notDone: qIds.length - submitted }
  }

  // Unassigned students
  const unassigned = studentsByClass.get('__none__') ?? []

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">All Student Progress</h1>
        <Link href="/teacher" className="text-purple-600 text-sm hover:underline">← Dashboard</Link>
      </div>

      {(classes ?? []).map(cls => {
        const classStudents = studentsByClass.get(cls.id) ?? []
        const qIds = getAssignedQIds(cls.id)

        if (classStudents.length === 0) return (
          <section key={cls.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-800">{cls.title}</h2>
              <Link href={`/teacher/class/${cls.id}`} className="text-xs text-purple-600 hover:underline">Manage →</Link>
            </div>
            <p className="text-gray-400 text-sm">No students enrolled.</p>
          </section>
        )

        // Sort: most struggling first, then by completion %
        const rows = classStudents.map(s => ({ ...s, ...getStats(s.id, cls.id) }))
          .sort((a, b) => {
            const aStruggling = a.incorrect > 0 && a.incorrect >= a.correct ? 1 : 0
            const bStruggling = b.incorrect > 0 && b.incorrect >= b.correct ? 1 : 0
            if (bStruggling !== aStruggling) return bStruggling - aStruggling
            const aPct = a.total > 0 ? a.submitted / a.total : 1
            const bPct = b.total > 0 ? b.submitted / b.total : 1
            return aPct - bPct
          })

        const classCorrect = rows.reduce((s, r) => s + r.correct, 0)
        const classTotal = rows.reduce((s, r) => s + r.total, 0)
        const classSubmitted = rows.reduce((s, r) => s + r.submitted, 0)

        return (
          <section key={cls.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-800">{cls.title}</h2>
              <span className="text-xs text-gray-500">{classStudents.length} students · {qIds.length} questions assigned</span>
              <Link href={`/teacher/class/${cls.id}`} className="text-xs text-purple-600 hover:underline">Manage →</Link>
            </div>

            {/* Class summary bar */}
            {classTotal > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[160px]">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Class completion</span>
                    <span>{classTotal > 0 ? Math.round((classSubmitted / classTotal) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${classTotal > 0 ? Math.round((classSubmitted / classTotal) * 100) : 0}%` }} />
                  </div>
                </div>
                <div className="flex gap-4 text-sm flex-shrink-0">
                  <span className="text-green-700 font-semibold">✓ {classCorrect} correct</span>
                  <span className="text-gray-500">{classSubmitted}/{classTotal} submitted</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Student</th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-700">Done</th>
                      <th className="text-center px-3 py-3 font-semibold text-amber-600">Not Done</th>
                      <th className="text-center px-3 py-3 font-semibold text-green-700">✓ Correct</th>
                      <th className="text-center px-3 py-3 font-semibold text-amber-600">~ Partial</th>
                      <th className="text-center px-3 py-3 font-semibold text-red-600">✗ Wrong</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">Progress</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s, i) => {
                      const pct = s.total > 0 ? Math.round((s.submitted / s.total) * 100) : 0
                      const struggling = s.incorrect > 0 && s.incorrect >= s.correct
                      const allDone = s.total > 0 && s.submitted === s.total && s.notDone === 0
                      return (
                        <tr key={s.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{s.full_name}</td>
                          <td className="px-3 py-3 text-center text-gray-600">{s.submitted}/{s.total}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`font-semibold ${s.notDone > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{s.notDone}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`font-semibold ${s.correct > 0 ? 'text-green-700' : 'text-gray-300'}`}>{s.correct}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`font-semibold ${s.partial > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{s.partial}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`font-semibold ${s.incorrect > 0 ? 'text-red-600' : 'text-gray-300'}`}>{s.incorrect}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${struggling ? 'bg-red-400' : allDone ? 'bg-green-500' : 'bg-purple-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {s.total === 0 ? (
                              <span className="text-xs text-gray-400">No questions</span>
                            ) : struggling ? (
                              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Struggling</span>
                            ) : allDone && s.correct === s.total ? (
                              <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">All correct!</span>
                            ) : allDone ? (
                              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Submitted all</span>
                            ) : s.submitted === 0 ? (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Not started</span>
                            ) : (
                              <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">In progress</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )
      })}

      {unassigned.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-500 mb-3">Students Without a Class</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            {unassigned.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{s.full_name}</span>
                <Link href="/teacher/students" className="text-xs text-purple-600 hover:underline">Assign class →</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {(classes ?? []).length === 0 && (
        <p className="text-gray-500">No classes yet. <Link href="/teacher/content" className="text-purple-600 underline">Create one →</Link></p>
      )}
    </div>
  )
}
