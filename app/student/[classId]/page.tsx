import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import StudentGradeNotifications from '@/components/StudentGradeNotifications'

export default async function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const studentId = user.id

  const [{ data: cls }, { data: units }, { data: publishedTests }] = await Promise.all([
    supabase.from('classes').select('*').eq('id', classId).single(),
    supabase.from('units').select('*').eq('class_id', classId).order('order_index'),
    supabase.from('diagnostic_tests').select('id, title, description, slug').eq('class_id', classId).eq('is_active', true),
  ])

  if (!cls) notFound()

  // Own completed-attempt lookup for the published tests above, keyed by
  // test so the card can show a score instead of "Start" once finished.
  // Uses the admin client purely to read this student's own rows (their id
  // comes from the verified session above) — diagnostic_leads/attempts have
  // no student-facing RLS policy since every other access to them is
  // service-role only (public lead-capture flow, teacher dashboard).
  let completedByTestId = new Map<string, { attemptId: string; scorePct: number; submittedAt: string }>()
  if (publishedTests && publishedTests.length > 0) {
    const admin = await createAdminClient()
    const { data: myLeads } = await admin
      .from('diagnostic_leads')
      .select('id, diagnostic_test_id')
      .eq('student_id', studentId)
      .in('diagnostic_test_id', publishedTests.map(t => t.id))
    const leadIds = (myLeads ?? []).map(l => l.id)
    const testIdByLead = new Map((myLeads ?? []).map(l => [l.id, l.diagnostic_test_id]))
    const { data: myAttempts } = leadIds.length > 0
      ? await admin
          .from('diagnostic_attempts')
          .select('id, lead_id, status, score_pct, submitted_at')
          .in('lead_id', leadIds)
          .eq('status', 'completed')
          .order('submitted_at', { ascending: false })
      : { data: [] as { id: string; lead_id: string; status: string; score_pct: number; submitted_at: string }[] }
    // Keep only the most recent completed attempt per test (retakes allowed).
    for (const a of myAttempts ?? []) {
      const testId = testIdByLead.get(a.lead_id)
      if (testId && !completedByTestId.has(testId)) {
        completedByTestId.set(testId, { attemptId: a.id, scorePct: a.score_pct, submittedAt: a.submitted_at })
      }
    }
  }

  const unitIds = units?.map(u => u.id) ?? []
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, title, unit_id').in('unit_id', unitIds).order('order_index')
    : { data: [] }

  const topicIds = topics?.map(t => t.id) ?? []
  const [{ data: allQuestions }, { data: classAssignments }, { data: studentAssignments }] = await Promise.all([
    topicIds.length > 0
      ? supabase.from('questions').select('id, topic_id').in('topic_id', topicIds)
      : Promise.resolve({ data: [] }),
    supabase.from('assignments').select('question_id').eq('class_id', classId),
    supabase.from('student_assignments').select('question_id').eq('student_id', studentId),
  ])
  // Only show assigned questions
  const classQIds = new Set((classAssignments ?? []).map((a: { question_id: string }) => a.question_id))
  const studentQIds = new Set((studentAssignments ?? []).map((a: { question_id: string }) => a.question_id))
  const assignedIds = new Set([...classQIds, ...studentQIds])
  const questions = allQuestions?.filter(q => assignedIds.has(q.id)) ?? []

  const questionIds = questions?.map(q => q.id) ?? []
  const { data: submissions } = questionIds.length > 0
    ? await supabase.from('submissions').select('id, question_id').eq('student_id', studentId).in('question_id', questionIds)
    : { data: [] }

  const submissionIds = submissions?.map(s => s.id) ?? []
  const { data: feedbacks } = submissionIds.length > 0
    ? await supabase.from('feedback').select('grade, submission_id').in('submission_id', submissionIds)
    : { data: [] }

  // Lookup helpers
  const submissionByQuestion = new Map(submissions?.map(s => [s.question_id, s.id]))
  const gradeBySubmission = new Map(feedbacks?.map(f => [f.submission_id, f.grade as string | null]))

  // Overall stats
  const total = questionIds.length
  const submitted = submissions?.length ?? 0
  const correct = feedbacks?.filter(f => f.grade === 'correct').length ?? 0
  const incorrect = feedbacks?.filter(f => f.grade === 'incorrect').length ?? 0
  const partial = feedbacks?.filter(f => f.grade === 'partial').length ?? 0
  const remaining = total - submitted
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-4">{cls.title}</h1>

      {/* Big, hard-to-miss Self Study banner — this is the entry point for
          the whole custom-test/review-folder feature, so it shouldn't read
          as a small secondary link buried next to the title. */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-lg font-bold">📝 Self Study</p>
            <p className="text-sm text-purple-100 mt-0.5">Build your own practice test, or review questions you've flagged.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href={`/student/${classId}/practice/build`}
              className="bg-white text-purple-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-colors"
            >
              ✏️ Create a Test
            </Link>
            <Link
              href={`/student/${classId}/practice/review`}
              className="bg-purple-500/40 hover:bg-purple-500/60 text-white font-semibold text-sm px-4 py-2.5 rounded-xl border border-white/30 transition-colors"
            >
              🚩 Review
            </Link>
          </div>
        </div>
      </div>

      {publishedTests && publishedTests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">🧪 Tests</h2>
          <div className="space-y-2">
            {publishedTests.map(t => {
              const completed = completedByTestId.get(t.id)
              return (
                <a
                  key={t.id}
                  href={completed ? `/diagnostic/${t.slug}/results/${completed.attemptId}` : `/diagnostic/${t.slug}`}
                  className="flex items-center justify-between gap-3 bg-gray-50 hover:bg-purple-50 rounded-lg p-3 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.title}</p>
                    {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                  </div>
                  {completed ? (
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
                      ✓ {Math.round(completed.scorePct)}%
                    </span>
                  ) : (
                    <span className="text-purple-600 text-sm font-semibold flex-shrink-0">Start →</span>
                  )}
                </a>
              )
            })}
          </div>
        </div>
      )}

      <StudentGradeNotifications studentId={studentId} />

      {/* Overall progress */}
      {total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">📊 Your Progress</h2>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
            <div className="bg-purple-600 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-700">{submitted}/{total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Submitted</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{remaining}</p>
              <p className="text-xs text-gray-500 mt-0.5">Remaining</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{correct}</p>
              <p className="text-xs text-gray-500 mt-0.5">Correct</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{incorrect}</p>
              <p className="text-xs text-gray-500 mt-0.5">Incorrect</p>
            </div>
          </div>
          {partial > 0 && (
            <p className="text-xs text-amber-600 mt-2 text-center">{partial} partially correct</p>
          )}
        </div>
      )}

      {/* Units list with per-topic breakdown */}
      {!units?.length ? (
        <p className="text-gray-500">No units yet. Check back soon!</p>
      ) : (
        <div className="space-y-4">
          {units.map((unit, i) => {
            const unitTopics = topics?.filter(t => t.unit_id === unit.id) ?? []
            const unitQIds = questions?.filter(q => unitTopics.some(t => t.id === q.topic_id)).map(q => q.id) ?? []
            const unitSubmitted = submissions?.filter(s => unitQIds.includes(s.question_id)).length ?? 0
            const unitTotal = unitQIds.length

            // Per-topic stats
            const topicStats = unitTopics.map(topic => {
              const tQIds = questions?.filter(q => q.topic_id === topic.id).map(q => q.id) ?? []
              let tCorrect = 0, tIncorrect = 0, tPartial = 0, tSubmitted = 0
              for (const qId of tQIds) {
                const subId = submissionByQuestion.get(qId)
                if (!subId) continue
                tSubmitted++
                const g = gradeBySubmission.get(subId)
                if (g === 'correct') tCorrect++
                else if (g === 'incorrect') tIncorrect++
                else if (g === 'partial') tPartial++
              }
              return { topic, total: tQIds.length, submitted: tSubmitted, correct: tCorrect, incorrect: tIncorrect, partial: tPartial }
            })

            return (
              <div key={unit.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-purple-300 hover:shadow-md transition-all">
                {/* Unit header */}
                <Link href={`/student/${classId}/${unit.id}`} className="flex items-center gap-4 p-5 group">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-800 group-hover:text-purple-800 transition-colors">{unit.title}</h2>
                    {unitTotal > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.round((unitSubmitted / unitTotal) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{unitSubmitted}/{unitTotal} submitted</span>
                      </div>
                    )}
                  </div>
                  {unitTotal > 0 && unitSubmitted === unitTotal && (
                    <span className="text-green-600 text-sm font-bold flex-shrink-0">✓ Done</span>
                  )}
                </Link>

                {/* Per-topic rows */}
                {topicStats.length > 0 && (
                  <div className="border-t border-gray-100">
                    {topicStats.map(({ topic, total: tTotal, submitted: tSub, correct: tC, incorrect: tI, partial: tP }) => {
                      const tRemaining = tTotal - tSub
                      const struggling = tI > 0 && tI >= tC
                      return (
                        <Link
                          key={topic.id}
                          href={`/student/${classId}/${unit.id}/${topic.id}`}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            tTotal === 0        ? 'bg-gray-200' :
                            tSub === 0          ? 'bg-gray-300' :
                            struggling          ? 'bg-red-400' :
                            tC > 0 && tRemaining === 0 ? 'bg-green-400' :
                                                  'bg-amber-400'
                          }`} />
                          <span className="text-sm text-gray-700 flex-1">{topic.title}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {tSub === 0 && tTotal > 0 && (
                              <span className="text-xs text-gray-400">{tTotal} not started</span>
                            )}
                            {tC > 0 && <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">✓ {tC}</span>}
                            {tP > 0 && <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">~ {tP}</span>}
                            {tI > 0 && <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">✗ {tI}</span>}
                            {tRemaining > 0 && tSub > 0 && <span className="text-xs text-gray-400">{tRemaining} left</span>}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
