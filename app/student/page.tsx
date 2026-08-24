import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function adminDb() {
  return createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

const GRADE_STYLE: Record<string, { icon: string; label: string }> = {
  correct:   { icon: '✅', label: 'Correct!' },
  partial:   { icon: '🟡', label: 'Partially correct' },
  discussed: { icon: '💬', label: 'Discussed' },
  incorrect: { icon: '❌', label: 'Incorrect' },
  needsmore: { icon: '🔄', label: 'Needs more work' },
}

export default async function StudentDashboard() {
  const supabase = await createClient()
  // getUser() validates the token (and reflects the proxy's refresh) instead of
  // trusting a possibly-stale local session. Redirect on a momentarily-null auth
  // rather than crashing the page render.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = adminDb()
  const { data: enrollments } = await admin
    .from('class_enrollments')
    .select('class_id, classes(id, title)')
    .eq('student_id', user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classes = (enrollments ?? []).map((e: any) => {
    const c = e.classes
    return Array.isArray(c) ? c[0] : c
  }).filter(Boolean) as { id: string; title: string }[]

  if (classes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-96">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-purple-900 mb-2">No Class Assigned Yet</h2>
          <p className="text-gray-500">Your teacher hasn&apos;t assigned you to a class yet. Check back soon!</p>
        </div>
      </div>
    )
  }

  const classIds = classes.map(c => c.id)
  const classTitleById = new Map(classes.map(c => [c.id, c.title]))

  // ── Study plan — teacher-shared AI pacing plan, if any (see
  // app/teacher/planning). Guarded so a not-yet-migrated table never
  // breaks the dashboard. Can span several weeks, not just "this week".
  const { data: weeklyPlanRows } = await admin
    .from('weekly_plans')
    .select('class_id, sessions, generated_at')
    .in('class_id', classIds)
    .eq('shared', true)
  const weeklyPlans = (weeklyPlanRows ?? []).map((w: { class_id: string; sessions: { date: string; dayLabel?: string; focusTopics: string[]; rationale: string; homeworkSuggestion?: string | null }[]; generated_at: string }) => ({
    classId: w.class_id,
    classTitle: classTitleById.get(w.class_id) ?? '',
    sessions: w.sessions,
    generatedAt: w.generated_at,
  }))

  // ── Pending Tests count — published+active tests across every enrolled
  // class this student hasn't completed yet, for the dashboard summary card.
  const { data: publishedTests } = await admin
    .from('diagnostic_tests')
    .select('id')
    .in('class_id', classIds)
    .eq('is_active', true)
  let pendingTestCount = 0
  if (publishedTests && publishedTests.length > 0) {
    const { data: myLeads } = await admin
      .from('diagnostic_leads')
      .select('id, diagnostic_test_id')
      .eq('student_id', user.id)
      .in('diagnostic_test_id', publishedTests.map(t => t.id))
    const leadIds = (myLeads ?? []).map(l => l.id)
    const testIdByLead = new Map((myLeads ?? []).map(l => [l.id, l.diagnostic_test_id]))
    const { data: myAttempts } = leadIds.length > 0
      ? await admin.from('diagnostic_attempts').select('lead_id').in('lead_id', leadIds).eq('status', 'completed')
      : { data: [] as { lead_id: string }[] }
    const completedTestIds = new Set((myAttempts ?? []).map(a => testIdByLead.get(a.lead_id)).filter(Boolean))
    pendingTestCount = publishedTests.filter(t => !completedTestIds.has(t.id)).length
  }

  // ── Per-class progress (assigned / submitted / graded) ─────────────────
  const [{ data: units }, { data: classAssignments }, { data: studentAssignments }] = await Promise.all([
    admin.from('units').select('id, class_id').in('class_id', classIds),
    admin.from('assignments').select('question_id, class_id').in('class_id', classIds),
    admin.from('student_assignments').select('question_id').eq('student_id', user.id),
  ])
  const unitIds = (units ?? []).map(u => u.id)
  const { data: topics } = unitIds.length > 0
    ? await admin.from('topics').select('id, unit_id').in('unit_id', unitIds)
    : { data: [] as { id: string; unit_id: string }[] }
  const topicIds = (topics ?? []).map(t => t.id)
  const { data: questions } = topicIds.length > 0
    ? await admin.from('questions').select('id, topic_id').in('topic_id', topicIds)
    : { data: [] as { id: string; topic_id: string }[] }

  const unitByClass = new Map((units ?? []).map(u => [u.id, u.class_id]))
  const topicByUnit = new Map((topics ?? []).map(t => [t.id, t.unit_id]))
  const classOfQuestion = new Map((questions ?? []).map(q => {
    const unitId = topicByUnit.get(q.topic_id)
    return [q.id, unitId ? unitByClass.get(unitId) : undefined]
  }))
  const topicByQuestion = new Map((questions ?? []).map(q => [q.id, q.topic_id]))

  const studentAssignedIds = new Set((studentAssignments ?? []).map(a => a.question_id))
  const assignedByClass = new Map<string, Set<string>>()
  for (const a of classAssignments ?? []) {
    if (!assignedByClass.has(a.class_id)) assignedByClass.set(a.class_id, new Set())
    assignedByClass.get(a.class_id)!.add(a.question_id)
  }
  for (const qId of studentAssignedIds) {
    const cid = classOfQuestion.get(qId)
    if (cid) { if (!assignedByClass.has(cid)) assignedByClass.set(cid, new Set()); assignedByClass.get(cid)!.add(qId) }
  }

  const allAssignedIds = [...new Set([...assignedByClass.values()].flatMap(s => [...s]))]
  const { data: submissions } = allAssignedIds.length > 0
    ? await admin.from('submissions').select('id, question_id').eq('student_id', user.id).in('question_id', allAssignedIds)
    : { data: [] as { id: string; question_id: string }[] }
  const submissionIds = (submissions ?? []).map(s => s.id)
  const { data: feedbacks } = submissionIds.length > 0
    ? await admin.from('feedback').select('submission_id, grade').in('submission_id', submissionIds)
    : { data: [] as { submission_id: string; grade: string | null }[] }
  const gradeBySubmission = new Map((feedbacks ?? []).map(f => [f.submission_id, f.grade]))
  const submittedQIds = new Set((submissions ?? []).map(s => s.question_id))
  const gradedQIds = new Set((submissions ?? []).filter(s => gradeBySubmission.get(s.id)).map(s => s.question_id))

  const classStats = classes.map(cls => {
    const assigned = assignedByClass.get(cls.id) ?? new Set<string>()
    const total = assigned.size
    const submitted = [...assigned].filter(id => submittedQIds.has(id)).length
    const graded = [...assigned].filter(id => gradedQIds.has(id)).length
    const toDo = total - submitted
    return { ...cls, total, submitted, graded, toDo, pct: total > 0 ? Math.round((graded / total) * 100) : 0 }
  })

  // ── Recent activity — grades, teacher comments, and newly assigned
  // questions, merged into one feed so a student can see everything that
  // happened without hunting through each class separately. ─────────────
  const { data: rawNotifs } = await admin
    .from('student_notifications')
    .select('id, type, grade, feedback, read, created_at, question_id')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8)

  const notifQIds = [...new Set((rawNotifs ?? []).map(n => n.question_id).filter(Boolean))]
  const { data: notifQuestions } = notifQIds.length > 0
    ? await admin.from('questions').select('id, title').in('id', notifQIds)
    : { data: [] as { id: string; title: string }[] }
  const questionTitleById = new Map((notifQuestions ?? []).map(q => [q.id, q.title]))

  const activity = (rawNotifs ?? []).map(n => {
    const questionTitle = questionTitleById.get(n.question_id) ?? 'a question'
    const topicId = n.question_id ? topicByQuestion.get(n.question_id) : undefined
    const unitId = topicId ? topicByUnit.get(topicId) : undefined
    const classId = unitId ? unitByClass.get(unitId) : undefined
    const href = classId && unitId && topicId && n.question_id
      ? `/student/${classId}/${unitId}/${topicId}/${n.question_id}`
      : '/student/notifications'
    if (n.type === 'assignment') {
      return { id: n.id, icon: '📋', text: 'New question assigned', sub: questionTitle, at: n.created_at, href }
    }
    if (n.type === 'comment') {
      return { id: n.id, icon: '💬', text: 'Teacher left a comment', sub: n.feedback ? `"${n.feedback}"` : questionTitle, at: n.created_at, href }
    }
    const g = n.grade ? GRADE_STYLE[n.grade] : null
    return { id: n.id, icon: g?.icon ?? '📝', text: g?.label ?? 'Work reviewed', sub: questionTitle, at: n.created_at, href }
  })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">My Dashboard</h1>

      {/* Tests summary — pending count front and center, links through to the
          full pending/completed breakdown across every class. */}
      <Link
        href="/student/tests"
        className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-5 mb-8 hover:border-purple-400 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">🧪</div>
          <div>
            <p className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">Tests</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {pendingTestCount > 0 ? `${pendingTestCount} pending` : 'See your results'} · click to view
            </p>
          </div>
        </div>
        {pendingTestCount > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">{pendingTestCount} to do</span>
        )}
      </Link>

      {/* Study plan — teacher-shared AI pacing plan per class, may span weeks */}
      {weeklyPlans.length > 0 && (
        <section className="mb-8 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Study Plan</h2>
          {weeklyPlans.map(plan => (
            <div key={plan.classId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-100">
                <span className="text-sm font-bold text-purple-900">{plan.classTitle}</span>
              </div>
              {plan.sessions.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-3">Nothing planned yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {plan.sessions.map((s, i) => (
                    <div key={i} className="px-4 py-2.5 text-sm">
                      <p className="font-semibold text-gray-800">
                        {s.dayLabel || (() => {
                          if (!s.date) return 'Unknown date'
                          const d = new Date(`${s.date}T00:00:00`)
                          return isNaN(d.getTime()) ? s.date : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                        })()}
                      </p>
                      <p className="text-gray-600 mt-0.5">{s.focusTopics.join(', ')}</p>
                      {s.homeworkSuggestion && (
                        <p className="text-xs text-purple-700 bg-purple-50 rounded-lg px-2.5 py-1.5 mt-1.5">
                          📝 Before next session: {s.homeworkSuggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Recent activity — feedback, comments, new assignments, all in one place */}
      {activity.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Activity</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {activity.map(a => (
              <Link key={a.id} href={a.href} className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors">
                <span className="text-lg flex-shrink-0">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{a.text}</p>
                  <p className="text-xs text-gray-500 truncate">{a.sub}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(a.at)}</span>
              </Link>
            ))}
          </div>
          <Link href="/student/notifications" className="block text-center text-xs text-purple-600 hover:underline mt-2">
            View all notifications →
          </Link>
        </section>
      )}

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Classes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {classStats.map(cls => (
          <Link
            key={cls.id}
            href={`/student/${cls.id}`}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="text-3xl mb-3">📚</div>
              {cls.toDo > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{cls.toDo} to do</span>
              )}
            </div>
            <h2 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">{cls.title}</h2>
            {cls.total > 0 ? (
              <>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${cls.pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{cls.graded}/{cls.total} graded · {cls.submitted} submitted</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-1">No assignments yet</p>
            )}
            <p className="text-sm text-purple-600 mt-3">Open class →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
