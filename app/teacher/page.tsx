import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
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

export default async function TeacherDashboard() {
  const supabase = adminDb()

  const { data: classes } = await supabase.from('classes').select('id, title').order('order_index')

  const classIds = classes?.map(c => c.id) ?? []

  const [{ data: classEnrollments }, { data: units }, { data: allNotifs }] = await Promise.all([
    classIds.length > 0
      ? supabase.from('class_enrollments').select('student_id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('units').select('id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    // Used to build each student's "last activity" line and unread-help
    // flag below — needs both read and unread rows for recency, plus the
    // read flag specifically to know who still needs a response.
    classIds.length > 0
      ? supabase.from('notifications').select('id, type, student_id, question_id, class_id, created_at, read').in('class_id', classIds).order('created_at', { ascending: false }).limit(500)
      : Promise.resolve({ data: [] }),
  ])

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

  const topicById = new Map((topics ?? []).map(t => [t.id, t]))
  const questionMeta = new Map((questions ?? []).map(q => [
    q.id,
    { title: q.title, topicTitle: topicById.get(q.topic_id)?.title ?? '' },
  ]))

  // No .in('question_id', questionIds) filter here on purpose — as the
  // question bank grows past a few hundred rows, that filter alone builds a
  // request URL long enough for PostgREST to reject with a silent 400 (data
  // comes back null, and every downstream `allSubs ?? []` quietly renders as
  // empty instead of surfacing the failure). Fetching all submissions
  // unfiltered is cheap at this app's scale and matching against a specific
  // question still happens downstream via questionMeta/Map lookups.
  type Sub = { id: string; student_id: string; question_id: string; updated_at: string; canvas_data: string | null; text_answer: string | null }
  const { data: allSubs } = await supabase
    .from('submissions')
    .select('id, student_id, question_id, updated_at, canvas_data, text_answer')

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
    studentId: string
    type: 'help' | 'submitted' | 'comment' | 'writing'
    questionTitle: string
    topicTitle: string
    at: string
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

    const classNotifs = (allNotifs ?? []).filter(n => n.class_id === cls.id)

    // Each student's single most recent event (help/submitted/comment, or
    // just unsubmitted work sitting on the board) — used for the roster's
    // "last activity" line below.
    const latestByStudent = new Map<string, StudentActivity>()
    const consider = (a: StudentActivity) => {
      const existing = latestByStudent.get(a.studentId)
      if (!existing || a.at > existing.at) latestByStudent.set(a.studentId, a)
    }
    for (const n of classNotifs) {
      if (n.type !== 'help' && n.type !== 'submitted' && n.type !== 'comment') continue
      const meta = questionMeta.get(n.question_id)
      consider({
        studentId: n.student_id, type: n.type as StudentActivity['type'],
        questionTitle: meta?.title ?? 'a question', topicTitle: meta?.topicTitle ?? '',
        at: n.created_at,
      })
    }
    for (const s of classSubs) {
      if (!hasContent(s)) continue
      const meta = questionMeta.get(s.question_id)
      consider({
        studentId: s.student_id, type: 'writing',
        questionTitle: meta?.title ?? 'a question', topicTitle: meta?.topicTitle ?? '',
        at: s.updated_at,
      })
    }

    // Unread help pings — surfaced as a badge on the roster row (and rolled
    // up into the class summary badge below) so a student currently stuck
    // stands out from one who's just quietly working.
    const helpUnreadStudentIds = new Set(
      classNotifs.filter(n => n.type === 'help' && !n.read).map(n => n.student_id)
    )

    // Full roster — every enrolled student, not just ones with recent
    // activity, since a teacher prepping for a 1-1 needs to be able to pull
    // up anyone's overall history, including students who haven't done
    // anything yet.
    const roster = classStudents
      .map(student => {
        const subs = classSubs.filter(s => s.student_id === student.id)
        let submitted = 0, correct = 0, partial = 0, incorrect = 0
        for (const s of subs) {
          if (!hasContent(s)) continue
          submitted++
          const grade = gradeBySubmission.get(s.id)
          if (grade === 'correct') correct++
          else if (grade === 'partial') partial++
          else if (grade === 'incorrect') incorrect++
        }
        return {
          id: student.id,
          name: student.full_name,
          submitted,
          total: classQIds.size,
          correct, partial, incorrect,
          needsHelp: helpUnreadStudentIds.has(student.id),
          lastActivity: latestByStudent.get(student.id) ?? null,
        }
      })
      .sort((a, b) => Number(b.needsHelp) - Number(a.needsHelp) || a.name.localeCompare(b.name))

    return {
      ...cls,
      studentCount: classStudents.length,
      questionCount: classQIds.size,
      submittedCount: classSubs.length,
      ungradedCount,
      needsHelpCount: roster.filter(s => s.needsHelp).length,
      roster,
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-purple-900">Teacher Dashboard</h1>

      {/* Classes → student roster. Expand a class to see every enrolled
          student with a clickable profile link — built for pulling
          someone up mid 1-1 and seeing their overall struggles at a
          glance, not just who happens to be active right now. */}
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
                      {cls.needsHelpCount > 0 && (
                        <span className="ml-2 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full align-middle group-open:hidden">
                          🙋 {cls.needsHelpCount} need help
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
                        className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        {cls.ungradedCount} to grade
                      </Link>
                    ) : cls.submittedCount > 0 ? (
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">All caught up</span>
                    ) : (
                      <span className="text-xs text-gray-400">No submissions yet</span>
                    )}
                    <Link href={`/teacher/class/${cls.id}`} className="text-xs text-purple-600 hover:underline font-medium whitespace-nowrap">Manage class →</Link>
                    <span className="text-gray-300 text-xs group-open:rotate-180 transition-transform">▾</span>
                  </div>
                </summary>

                {/* Student roster — click a name to open their full profile
                    (submissions by subtopic, grades, help-request history)
                    for 1-1 prep. */}
                <div className="px-5 pb-4">
                  {cls.roster.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No students enrolled yet.</p>
                  ) : (
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 bg-gray-50/50">
                      {cls.roster.map(s => (
                        <Link
                          key={s.id}
                          href={`/teacher/students/${s.id}`}
                          className={`flex items-center gap-3 px-3 py-2 hover:bg-white transition-colors ${s.needsHelp ? 'bg-amber-50' : ''}`}
                        >
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate flex items-center gap-1.5">
                              {s.name}
                              {s.needsHelp && (
                                <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">🙋 needs help</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {s.submitted}/{s.total} submitted
                              {s.correct > 0 && <span className="text-green-600 font-medium"> · ✓{s.correct}</span>}
                              {s.partial > 0 && <span className="text-amber-600 font-medium"> ~{s.partial}</span>}
                              {s.incorrect > 0 && <span className="text-red-500 font-medium"> ✗{s.incorrect}</span>}
                            </p>
                            {s.lastActivity ? (
                              <p className="text-[11px] text-gray-400 truncate">
                                {ACTIVITY_ICON[s.lastActivity.type]} {ACTIVITY_LABEL[s.lastActivity.type]}
                                {s.lastActivity.topicTitle && <> · {s.lastActivity.topicTitle}</>} · {timeAgo(s.lastActivity.at)}
                              </p>
                            ) : (
                              <p className="text-[11px] text-gray-300 truncate">No activity yet</p>
                            )}
                          </div>
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
