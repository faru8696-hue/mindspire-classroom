import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { aggregateTopicScores, type TopicScore } from '@/lib/diagnosticGrading'

export default async function AllProgressPage() {
  const supabase = await createAdminClient()

  const [{ data: classes }, { data: allStudents }, { data: allEnrollments }] = await Promise.all([
    supabase.from('classes').select('id, title').order('order_index'),
    supabase.from('profiles').select('id, full_name').eq('role', 'student').eq('approved', true).order('full_name'),
    supabase.from('class_enrollments').select('student_id, class_id'),
  ])

  const classIds = classes?.map(c => c.id) ?? []

  // Tests published to these classes, and each enrolled student's most
  // recent completed attempt per test — a separate model from the
  // questions/submissions/feedback progress table below (score_pct rather
  // than per-question correct/partial/wrong), so it's rendered as its own
  // small panel per class instead of folded into that table's columns.
  const { data: publishedTests } = classIds.length > 0
    ? await supabase.from('diagnostic_tests').select('id, title, slug, class_id').in('class_id', classIds).eq('is_active', true)
    : { data: [] as { id: string; title: string; slug: string; class_id: string }[] }
  const testIds = (publishedTests ?? []).map(t => t.id)
  const allStudentIds = (allStudents ?? []).map(s => s.id)
  const { data: testLeads } = testIds.length > 0 && allStudentIds.length > 0
    ? await supabase.from('diagnostic_leads').select('id, diagnostic_test_id, student_id').in('diagnostic_test_id', testIds).in('student_id', allStudentIds)
    : { data: [] as { id: string; diagnostic_test_id: string; student_id: string | null }[] }
  const testLeadIds = (testLeads ?? []).map(l => l.id)
  const { data: testAttempts } = testLeadIds.length > 0
    ? await supabase.from('diagnostic_attempts').select('id, lead_id, score_pct, submitted_at').in('lead_id', testLeadIds).eq('status', 'completed').order('submitted_at', { ascending: false })
    : { data: [] as { id: string; lead_id: string; score_pct: number; submitted_at: string }[] }
  const leadById = new Map((testLeads ?? []).map(l => [l.id, l]))
  // key: `${studentId}:${testId}` → most recent completed score (retakes keep the latest)
  const testScoreByStudent = new Map<string, number>()
  // key: `${studentId}:${testId}` → that attempt's id, so we can pull its
  // per-question answers below and show a topic-level breakdown alongside
  // the score, not just a bare percentage.
  const testAttemptIdByStudent = new Map<string, string>()
  for (const a of testAttempts ?? []) {
    const lead = leadById.get(a.lead_id)
    if (!lead?.student_id) continue
    const key = `${lead.student_id}:${lead.diagnostic_test_id}`
    if (!testScoreByStudent.has(key)) {
      testScoreByStudent.set(key, a.score_pct)
      testAttemptIdByStudent.set(key, a.id)
    }
  }

  // Per-student topic breakdown for each of those most-recent attempts —
  // reuses the same aggregateTopicScores() the individual test's own
  // "Class Struggles" panel and the student's results page already use, so
  // this teacher view can show which topics a student is strong/weak on
  // right next to their score, not just the overall percentage.
  const relevantAttemptIds = [...testAttemptIdByStudent.values()]
  const { data: attemptAnswers } = relevantAttemptIds.length > 0
    ? await supabase.from('diagnostic_attempt_answers').select('attempt_id, question_id, is_correct').in('attempt_id', relevantAttemptIds)
    : { data: [] as { attempt_id: string; question_id: string; is_correct: boolean }[] }
  const answerQuestionIds = [...new Set((attemptAnswers ?? []).map(a => a.question_id))]
  const { data: diagQuestions } = answerQuestionIds.length > 0
    ? await supabase.from('diagnostic_questions').select('id, topic_id').in('id', answerQuestionIds)
    : { data: [] as { id: string; topic_id: string }[] }
  const diagTopicIdByQuestion = new Map((diagQuestions ?? []).map(q => [q.id, q.topic_id]))
  const diagTopicIds = [...new Set((diagQuestions ?? []).map(q => q.topic_id))]
  const { data: diagTopics } = diagTopicIds.length > 0
    ? await supabase.from('diagnostic_topics').select('id, title').in('id', diagTopicIds)
    : { data: [] as { id: string; title: string }[] }
  const diagTopicTitleById = new Map((diagTopics ?? []).map(t => [t.id, t.title]))
  const answersByAttempt = new Map<string, { topicId: string; topicTitle: string; isCorrect: boolean }[]>()
  for (const a of attemptAnswers ?? []) {
    const topicId = diagTopicIdByQuestion.get(a.question_id)
    if (!topicId) continue
    if (!answersByAttempt.has(a.attempt_id)) answersByAttempt.set(a.attempt_id, [])
    answersByAttempt.get(a.attempt_id)!.push({ topicId, topicTitle: diagTopicTitleById.get(topicId) ?? 'Unknown', isCorrect: a.is_correct })
  }
  // key: `${studentId}:${testId}` → topic scores, worst-first
  const testTopicScoresByStudent = new Map<string, TopicScore[]>()
  for (const [key, attemptId] of testAttemptIdByStudent) {
    const rows = answersByAttempt.get(attemptId)
    if (rows) testTopicScoresByStudent.set(key, aggregateTopicScores(rows))
  }
  const testsByClass = new Map<string, { id: string; title: string; slug: string }[]>()
  for (const t of publishedTests ?? []) {
    if (!testsByClass.has(t.class_id)) testsByClass.set(t.class_id, [])
    testsByClass.get(t.class_id)!.push(t)
  }

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

  // Load all submissions + feedback. Deliberately NOT also filtering by
  // .in('question_id', questionIds) here — with hundreds of questions across
  // all classes, combining that with the student_id filter builds a request
  // URL long enough that PostgREST rejects it outright with a silent 400
  // (Supabase returns { data: null, error }, and since callers do
  // `submissions ?? []`, every student's progress quietly rendered as 0/0
  // instead of surfacing the failure). The student_id filter alone keeps the
  // row count bounded to what these students have actually submitted;
  // matching against a specific question is still done downstream via the
  // `${studentId}:${questionId}` progressMap lookup, so the extra rows for
  // questions outside a given class are simply never read.
  const studentIds = allStudents?.map(s => s.id) ?? []
  const { data: submissions } = studentIds.length > 0
    ? await supabase.from('submissions').select('id, student_id, question_id').in('student_id', studentIds)
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

  const studentMap = new Map((allStudents ?? []).map(s => [s.id, s]))
  const enrolledStudentIds = new Set((allEnrollments ?? []).map(e => e.student_id))

  // Group students by class using class_enrollments
  const studentsByClass = new Map<string, { id: string; full_name: string }[]>()
  for (const e of allEnrollments ?? []) {
    const profile = studentMap.get(e.student_id)
    if (!profile) continue
    if (!studentsByClass.has(e.class_id)) studentsByClass.set(e.class_id, [])
    studentsByClass.get(e.class_id)!.push(profile)
  }
  // Sort each class's students alphabetically
  for (const arr of studentsByClass.values()) arr.sort((a, b) => a.full_name.localeCompare(b.full_name))

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

  // Unassigned students (approved but not in any class)
  const unassigned = (allStudents ?? []).filter(s => !enrolledStudentIds.has(s.id))

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
        const classTests = testsByClass.get(cls.id) ?? []

        return (
          <section key={cls.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-800">{cls.title}</h2>
              <span className="text-xs text-gray-500">{classStudents.length} students · {qIds.length} questions assigned</span>
              <Link href={`/teacher/class/${cls.id}`} className="text-xs text-purple-600 hover:underline">Manage →</Link>
            </div>

            {/* Published Test results — separate model (score_pct per attempt)
                from the questions/submissions table below, so it gets its own
                small panel per test rather than being folded into that table. */}
            {classTests.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">🧪 {t.title}</span>
                  <Link href={`/teacher/diagnostics`} className="text-xs text-purple-600 hover:underline ml-auto">Manage tests →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {classStudents.map(s => {
                    const key = `${s.id}:${t.id}`
                    const scorePct = testScoreByStudent.get(key)
                    const topicScores = testTopicScoresByStudent.get(key) ?? []
                    return (
                      <div key={s.id} className="px-4 py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">{s.full_name}</span>
                          {scorePct !== undefined ? (
                            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ {Math.round(scorePct)}%</span>
                          ) : (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Not started</span>
                          )}
                        </div>
                        {topicScores.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {topicScores.map(ts => (
                              <span
                                key={ts.topicId}
                                className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                                  ts.tier === 'mastered' ? 'bg-green-50 text-green-700' :
                                  ts.tier === 'developing' ? 'bg-amber-50 text-amber-700' :
                                                              'bg-red-50 text-red-600'
                                }`}
                              >
                                {ts.topicTitle} {ts.pct}%
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

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
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            <Link href={`/teacher/students/${s.id}`} className="text-purple-700 hover:underline">{s.full_name}</Link>
                          </td>
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
