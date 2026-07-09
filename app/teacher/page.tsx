import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Link from 'next/link'

function adminDb() {
  return createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// A single queue row — help requests, "done" pings, pending approvals, and
// per-class grading backlogs are all normalized into this shape so they can
// live in ONE prioritized list instead of four separate competing widgets.
interface QueueItem {
  id: string
  tier: number // 0 = most urgent, sorted ascending
  icon: string
  text: string
  sub?: string
  time?: string
  href: string
  action: string
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

export default async function TeacherDashboard() {
  const supabase = adminDb()

  const [
    { data: pendingProfiles },
    { data: classes },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name').eq('role', 'student').eq('approved', false).order('created_at'),
    supabase.from('classes').select('id, title').order('order_index'),
  ])

  const classIds = classes?.map(c => c.id) ?? []

  const [{ data: classEnrollments }, { data: units }, { data: recentNotifs }, { data: allNotifs }] = await Promise.all([
    classIds.length > 0
      ? supabase.from('class_enrollments').select('student_id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('units').select('id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('notifications')
      .select('id, type, student_id, question_id, class_id, created_at, read, profiles:profiles!notifications_student_id_fkey(full_name), questions:questions!notifications_question_id_fkey(title)')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(20),
    // Broader pull (read + unread) used to build the per-student "what are
    // they doing right now" activity list below — that needs recency, not
    // just unread state.
    classIds.length > 0
      ? supabase.from('notifications').select('id, type, student_id, question_id, class_id, created_at').in('class_id', classIds).order('created_at', { ascending: false }).limit(500)
      : Promise.resolve({ data: [] }),
  ])

  type Notif = { id: string; type: string; student_id: string; question_id: string; class_id: string; created_at: string; read: boolean; profiles: { full_name: string } | { full_name: string }[] | null; questions: { title: string } | { title: string }[] | null }

  const enrolledStudentIds = [...new Set((classEnrollments ?? []).map(e => e.student_id))]
  const { data: studentProfiles } = enrolledStudentIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', enrolledStudentIds)
    : { data: [] as { id: string; full_name: string }[] }
  const profileMap = new Map((studentProfiles ?? []).map(p => [p.id, p]))

  const unitIds = units?.map(u => u.id) ?? []
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, unit_id, title').in('unit_id', unitIds)
    : { data: [] as { id: string; unit_id: string; title: string }[] }

  const topicIds = (topics ?? []).map(t => t.id)
  const { data: questions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, topic_id, title').in('topic_id', topicIds)
    : { data: [] as { id: string; topic_id: string; title: string }[] }

  const questionIds = (questions ?? []).map(q => q.id)
  const topicById = new Map((topics ?? []).map(t => [t.id, t]))
  const questionMeta = new Map((questions ?? []).map(q => [
    q.id,
    { title: q.title, topicTitle: topicById.get(q.topic_id)?.title ?? '' },
  ]))

  type Sub = { id: string; student_id: string; question_id: string; updated_at: string; canvas_data: string | null; text_answer: string | null }
  const { data: allSubs } = questionIds.length > 0
    ? await supabase.from('submissions').select('id, student_id, question_id, updated_at, canvas_data, text_answer').in('question_id', questionIds)
    : { data: [] as Sub[] }

  // A submission row can exist with no real content (e.g. an empty '[]'
  // canvas the grade API auto-creates before the student's drawn anything),
  // so "has written something" needs an actual content check, not just row
  // existence.
  const hasContent = (s: Sub) => (s.canvas_data && s.canvas_data.length > 5) || (s.text_answer && s.text_answer.trim().length > 0)

  const subIds = (allSubs ?? []).map(s => s.id)
  const { data: feedbacks } = subIds.length > 0
    ? await supabase.from('feedback').select('submission_id, grade').in('submission_id', subIds)
    : { data: [] }
  const gradeBySubmission = new Map((feedbacks ?? []).map(f => [f.submission_id, f.grade]))

  // Per-class stats, scoped correctly to each class's own questions.
  interface StudentActivity {
    studentId: string; studentName: string
    type: 'help' | 'submitted' | 'comment' | 'writing'
    questionId: string; questionTitle: string; topicTitle: string
    at: string; href: string
  }

  const ACTIVITY_ICON: Record<StudentActivity['type'], string> = { help: '🙋', submitted: '✅', comment: '💬', writing: '✍️' }
  const ACTIVITY_LABEL: Record<StudentActivity['type'], string> = { help: 'needs help', submitted: 'finished', comment: 'commented', writing: 'writing' }

  const classStats = (classes ?? []).map(cls => {
    const classUnits = (units ?? []).filter(u => u.class_id === cls.id)
    const classTopics = (topics ?? []).filter(t => classUnits.some(u => u.id === t.unit_id))
    const classQIds = new Set((questions ?? []).filter(q => classTopics.some(t => t.id === q.topic_id)).map(q => q.id))
    const classStudents = (classEnrollments ?? [])
      .filter(e => e.class_id === cls.id)
      .map(e => profileMap.get(e.student_id))
      .filter((s): s is { id: string; full_name: string } => !!s?.full_name)

    const classSubs = (allSubs ?? []).filter(s => classQIds.has(s.question_id))
    const ungradedCount = classSubs.filter(s => !gradeBySubmission.get(s.id)).length

    // Per-student "what's happening right now" — one row per student who has
    // ANY activity (submission, comment, help request, or just unsubmitted
    // work on the board), showing which topic/question it's on. Each
    // student only shows their single most recent activity so this reads as
    // a status list, not a full event log.
    const latestByStudent = new Map<string, StudentActivity>()
    const consider = (a: StudentActivity) => {
      const existing = latestByStudent.get(a.studentId)
      if (!existing || a.at > existing.at) latestByStudent.set(a.studentId, a)
    }
    for (const n of (allNotifs ?? []) as { id: string; type: string; student_id: string; question_id: string; class_id: string; created_at: string }[]) {
      if (n.class_id !== cls.id) continue
      if (n.type !== 'help' && n.type !== 'submitted' && n.type !== 'comment') continue
      const student = profileMap.get(n.student_id)
      if (!student) continue
      const meta = questionMeta.get(n.question_id)
      const type = n.type as StudentActivity['type']
      consider({
        studentId: n.student_id, studentName: student.full_name, type,
        questionId: n.question_id, questionTitle: meta?.title ?? 'a question', topicTitle: meta?.topicTitle ?? '',
        at: n.created_at,
        href: type === 'submitted'
          ? `/teacher/submissions?student=${n.student_id}&question=${n.question_id}`
          : `/teacher/live/${cls.id}/${n.question_id}${type === 'comment' ? `?comment=${n.student_id}` : ''}`,
      })
    }
    for (const s of classSubs) {
      if (!hasContent(s)) continue
      const student = profileMap.get(s.student_id)
      if (!student) continue
      const meta = questionMeta.get(s.question_id)
      consider({
        studentId: s.student_id, studentName: student.full_name, type: 'writing',
        questionId: s.question_id, questionTitle: meta?.title ?? 'a question', topicTitle: meta?.topicTitle ?? '',
        at: s.updated_at,
        href: `/teacher/live/${cls.id}/${s.question_id}`,
      })
    }
    const activity = [...latestByStudent.values()].sort((a, b) => b.at.localeCompare(a.at))

    return {
      ...cls,
      studentCount: classStudents.length,
      questionCount: classQIds.size,
      submittedCount: classSubs.length,
      ungradedCount,
      activity,
    }
  })

  // ── Build the single "Needs your attention" queue ──────────────────────
  const queue: QueueItem[] = []
  const notifs = (recentNotifs ?? []) as unknown as Notif[]
  const nameOf = (p: Notif['profiles']) => (Array.isArray(p) ? p[0]?.full_name : p?.full_name) ?? 'A student'
  const titleOf = (q: Notif['questions']) => (Array.isArray(q) ? q[0]?.title : q?.title) ?? 'a question'

  // Tier 0 — live help requests (most time-sensitive)
  for (const n of notifs.filter(n => n.type === 'help')) {
    queue.push({
      id: n.id, tier: 0, icon: '🙋',
      text: `${nameOf(n.profiles)} needs help`,
      sub: titleOf(n.questions),
      time: timeAgo(n.created_at),
      href: `/teacher/live/${n.class_id}/${n.question_id}`,
      action: 'Help now',
    })
  }

  // Tier 1 — student comments (they sometimes type their actual answer into
  // the comment box instead of the board, so these need to surface here too,
  // not just on the live grid). Group multiple unread comments from the same
  // student on the same question into one row instead of spamming the queue.
  const commentNotifs = notifs.filter(n => n.type === 'comment')
  const commentGroups = new Map<string, { notif: Notif; count: number }>()
  for (const n of commentNotifs) {
    const key = `${n.student_id}:${n.question_id}`
    const existing = commentGroups.get(key)
    if (existing) existing.count++
    else commentGroups.set(key, { notif: n, count: 1 })
  }
  for (const { notif: n, count } of commentGroups.values()) {
    queue.push({
      id: n.id, tier: 1, icon: '💬',
      text: `${nameOf(n.profiles)} commented${count > 1 ? ` (${count})` : ''}`,
      sub: titleOf(n.questions),
      time: timeAgo(n.created_at),
      href: `/teacher/live/${n.class_id}/${n.question_id}?comment=${n.student_id}`,
      action: 'View comment',
    })
  }

  // Tier 1 — a student just finished a specific question (jump straight to grading it)
  for (const n of notifs.filter(n => n.type === 'submitted')) {
    queue.push({
      id: n.id, tier: 1, icon: '✅',
      text: `${nameOf(n.profiles)} finished`,
      sub: titleOf(n.questions),
      time: timeAgo(n.created_at),
      href: `/teacher/submissions?student=${n.student_id}&question=${n.question_id}`,
      action: 'Review',
    })
  }

  // Tier 2 — pending student approvals (blocks them from starting at all)
  const pending = pendingProfiles ?? []
  if (pending.length === 1) {
    queue.push({ id: 'approval', tier: 2, icon: '👋', text: `${pending[0].full_name} wants to join`, href: '/teacher/students', action: 'Review' })
  } else if (pending.length > 1) {
    queue.push({ id: 'approval', tier: 2, icon: '👋', text: `${pending.length} students waiting for approval`, href: '/teacher/students', action: 'Review' })
  }

  // Tier 3 — standing grading backlog, one row per class (not per submission —
  // that flat-list view already exists on the Submissions page itself).
  for (const cls of classStats) {
    if (cls.ungradedCount > 0) {
      queue.push({
        id: `grade-${cls.id}`, tier: 3, icon: '✏️',
        text: `${cls.ungradedCount} submission${cls.ungradedCount !== 1 ? 's' : ''} to grade`,
        sub: cls.title,
        href: `/teacher/submissions?class=${cls.id}`,
        action: 'Grade',
      })
    }
  }

  queue.sort((a, b) => a.tier - b.tier)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-purple-900">Teacher Dashboard</h1>

      {/* Needs your attention — one prioritized queue instead of four
          separate widgets (stat cards, notifications panel, recent
          submissions feed, live alerts feed) that used to show overlapping
          versions of the same information. */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Needs your attention</h2>
          {commentGroups.size > 0 && (
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              💬 {commentGroups.size} unread comment{commentGroups.size !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {queue.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-gray-500 font-medium">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {queue.map(item => (
              <Link key={item.id} href={item.href} className="flex items-center gap-4 px-5 py-3.5 hover:bg-purple-50 transition-colors">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.text}</p>
                  {item.sub && <p className="text-xs text-gray-400 truncate">{item.sub}</p>}
                </div>
                {item.time && <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>}
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap">{item.action} →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Classes at a glance */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Classes</h2>
        {classStats.length === 0 ? (
          <p className="text-gray-500 text-sm">No classes yet. <Link href="/teacher/content" className="text-purple-600 underline">Create one →</Link></p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {classStats.map(cls => (
              <details key={cls.id} className="group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {cls.title}
                      {cls.activity.length > 0 && (
                        <span className="ml-2 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full align-middle group-open:hidden">
                          {cls.activity.length} active
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''} · {cls.questionCount} question{cls.questionCount !== 1 ? 's' : ''} assigned
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {cls.ungradedCount > 0 ? (
                      <Link
                        href={`/teacher/submissions?class=${cls.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        {cls.ungradedCount} to grade
                      </Link>
                    ) : cls.submittedCount > 0 ? (
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">All caught up</span>
                    ) : (
                      <span className="text-xs text-gray-400">No submissions yet</span>
                    )}
                    <Link href={`/teacher/class/${cls.id}`} onClick={e => e.stopPropagation()} className="text-xs text-purple-600 hover:underline font-medium whitespace-nowrap">Manage class →</Link>
                    <span className="text-gray-300 text-xs group-open:rotate-180 transition-transform">▾</span>
                  </div>
                </summary>

                {/* Per-student activity — who's doing what, on which topic
                    and question, right now. */}
                <div className="px-5 pb-4">
                  {cls.activity.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No student activity yet.</p>
                  ) : (
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 bg-gray-50/50">
                      {cls.activity.map(a => (
                        <Link
                          key={a.studentId}
                          href={a.href}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-white transition-colors"
                        >
                          <span className="text-base flex-shrink-0">{ACTIVITY_ICON[a.type]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {a.studentName} <span className="font-normal text-gray-500">{ACTIVITY_LABEL[a.type]}</span>
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {a.topicTitle && <>{a.topicTitle} · </>}{a.questionTitle}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(a.at)}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
