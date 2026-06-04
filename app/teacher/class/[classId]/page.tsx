import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AssignQuestionsPanel from './AssignQuestionsPanel'

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createAdminClient()

  const [{ data: cls }, { data: students }, { data: units }] = await Promise.all([
    supabase.from('classes').select('*').eq('id', classId).single(),
    supabase.from('profiles').select('id, full_name').eq('class_id', classId).eq('role', 'student').eq('approved', true).order('full_name'),
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

  const questionIds = questions?.map(q => q.id) ?? []

  // Existing assignments for this class
  const { data: assignments } = questionIds.length > 0
    ? await supabase.from('assignments').select('question_id, due_date').eq('class_id', classId)
    : { data: [] }

  // All submissions + feedback for students in this class
  const studentIds = students?.map(s => s.id) ?? []
  const { data: submissions } = studentIds.length > 0 && questionIds.length > 0
    ? await supabase.from('submissions').select('id, student_id, question_id').in('student_id', studentIds).in('question_id', questionIds)
    : { data: [] }

  const submissionIds = submissions?.map(s => s.id) ?? []
  const { data: feedbacks } = submissionIds.length > 0
    ? await supabase.from('feedback').select('submission_id, grade').in('submission_id', submissionIds)
    : { data: [] }

  // Build lookup maps
  const gradeBySubmission = new Map(feedbacks?.map(f => [f.submission_id, f.grade as string]))
  // key: `${studentId}:${questionId}` → grade or 'submitted'
  const progressMap = new Map<string, string>()
  for (const sub of submissions ?? []) {
    const grade = gradeBySubmission.get(sub.id)
    progressMap.set(`${sub.student_id}:${sub.question_id}`, grade ?? 'submitted')
  }

  const assignedSet = new Set(assignments?.map(a => a.question_id) ?? [])
  const assignedQuestions = questions?.filter(q => assignedSet.has(q.id)) ?? []

  // Per-student summary
  const studentSummaries = (students ?? []).map(student => {
    let correct = 0, incorrect = 0, partial = 0, submitted = 0
    for (const qId of assignedQuestions.map(q => q.id)) {
      const status = progressMap.get(`${student.id}:${qId}`)
      if (!status) continue
      submitted++
      if (status === 'correct') correct++
      else if (status === 'incorrect') incorrect++
      else if (status === 'partial') partial++
    }
    const total = assignedQuestions.length
    const notDone = total - submitted
    return { ...student, correct, incorrect, partial, submitted, total, notDone }
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/teacher" className="text-purple-600 text-sm hover:underline">← Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold text-purple-900">{cls.title}</h1>

      {/* Student Progress Table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Student Progress</h2>
        {studentSummaries.length === 0 ? (
          <p className="text-gray-500 text-sm">No students enrolled yet.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Student</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Done</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Not Done</th>
                    <th className="text-center px-3 py-3 font-semibold text-green-700 whitespace-nowrap">✓ Correct</th>
                    <th className="text-center px-3 py-3 font-semibold text-amber-600 whitespace-nowrap">~ Partial</th>
                    <th className="text-center px-3 py-3 font-semibold text-red-600 whitespace-nowrap">✗ Wrong</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSummaries.map((s, i) => {
                    const pct = s.total > 0 ? Math.round((s.submitted / s.total) * 100) : 0
                    const struggling = s.incorrect > 0 && s.incorrect >= s.correct
                    return (
                      <tr key={s.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{s.full_name}</td>
                        <td className="px-3 py-3 text-center text-gray-600">{s.submitted}/{s.total}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-semibold ${s.notDone > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{s.notDone}</span>
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
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${struggling ? 'bg-red-400' : pct === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Per-topic breakdown for each student */}
      {studentSummaries.length > 0 && (units ?? []).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Topic Breakdown</h2>
          <div className="space-y-4">
            {(units ?? []).map(unit => {
              const unitTopics = topics?.filter(t => t.unit_id === unit.id) ?? []
              return (
                <div key={unit.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-700">{unit.title}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-2 font-medium text-gray-600 whitespace-nowrap w-40">Student</th>
                          {unitTopics.map(t => (
                            <th key={t.id} className="text-center px-3 py-2 font-medium text-gray-600 whitespace-nowrap max-w-[120px]">
                              <span className="block truncate" title={t.title}>{t.title}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {studentSummaries.map((student, i) => (
                          <tr key={student.id} className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                            <td className="px-4 py-2.5 font-medium text-gray-700 whitespace-nowrap">{student.full_name}</td>
                            {unitTopics.map(topic => {
                              const tQIds = assignedQuestions.filter(q => q.topic_id === topic.id).map(q => q.id)
                              if (tQIds.length === 0) {
                                return <td key={topic.id} className="px-3 py-2.5 text-center text-gray-300 text-xs">—</td>
                              }
                              let tc = 0, ti = 0, tp = 0, ts = 0
                              for (const qId of tQIds) {
                                const st = progressMap.get(`${student.id}:${qId}`)
                                if (!st) continue
                                ts++
                                if (st === 'correct') tc++
                                else if (st === 'incorrect') ti++
                                else if (st === 'partial') tp++
                              }
                              const allDone = ts === tQIds.length
                              const struggling = ti > 0 && ti >= tc
                              return (
                                <td key={topic.id} className="px-3 py-2.5 text-center">
                                  {ts === 0 ? (
                                    <span className="inline-block w-2 h-2 rounded-full bg-gray-200" title="Not started" />
                                  ) : struggling ? (
                                    <span className="text-xs font-semibold text-red-600" title={`${tc}✓ ${ti}✗ ${tp}~`}>✗{ti}</span>
                                  ) : allDone && tc === tQIds.length ? (
                                    <span className="text-xs font-semibold text-green-600" title="All correct">✓</span>
                                  ) : (
                                    <span className="text-xs text-gray-500" title={`${ts}/${tQIds.length} done`}>{ts}/{tQIds.length}</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Assign Questions Panel */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Assign Questions to This Class</h2>
        <AssignQuestionsPanel
          classId={classId}
          units={units ?? []}
          topics={topics ?? []}
          questions={(questions ?? []).map(q => ({ ...q, content: null }))}
          initialAssignments={(assignments ?? []).map(a => ({ question_id: a.question_id, due_date: a.due_date ?? null }))}
        />
      </section>
    </div>
  )
}
