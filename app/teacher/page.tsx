export const dynamic = 'force-dynamic'

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import { computeDayReport, computeWeekReport, type QuestionActivity, type DayReport, type WeekReport, type StudentInfo, type SubmissionForTracker, type QuestionMeta } from '@/lib/studyTracker'

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
function formatDayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function formatShort(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
function formatTimeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
function mondayISOOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}
const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// `estimatedMinutes` is only ever set when a question's first save and last
// save happened on the same calendar day within a 3-hour window — anything
// else (picked back up on a later day, or left open for hours) has no
// honest duration to show, so this labels those cases plainly instead of
// making up a number. See lib/studyTracker.ts for the full reasoning.
function durationLabel(q: QuestionActivity): string {
  if (q.estimatedMinutes !== null) return `~${q.estimatedMinutes} min`
  if (q.continuedFromEarlier) return 'continued from earlier'
  return 'long session (3h+)'
}

const SUB_GRADE_CLS: Record<string, string> = {
  correct: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  incorrect: 'bg-red-100 text-red-600',
}

export default async function TeacherDashboard({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; date?: string }>
}) {
  const supabase = adminDb()

  const { data: classes } = await supabase.from('classes').select('id, title').order('order_index')

  const classIds = classes?.map(c => c.id) ?? []

  const [{ data: classEnrollments }, { data: units }, { data: allNotifs }] = await Promise.all([
    classIds.length > 0
      ? supabase.from('class_enrollments').select('student_id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('units').select('id, class_id, title').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    // Used to build each student's "last activity" line and unread-help
    // flag below — needs both read and unread rows for recency, plus the
    // read flag specifically to know who still needs a response.
    classIds.length > 0
      ? supabase.from('notifications').select('id, type, student_id, question_id, class_id, diagnostic_test_id, created_at, read').in('class_id', classIds).order('created_at', { ascending: false }).limit(500)
      : Promise.resolve({ data: [] }),
  ])

  const diagTestIds = [...new Set((allNotifs ?? []).map(n => n.diagnostic_test_id).filter((id): id is string => !!id))]
  const { data: diagTests } = diagTestIds.length > 0
    ? await supabase.from('diagnostic_tests').select('id, title').in('id', diagTestIds)
    : { data: [] as { id: string; title: string }[] }
  const diagTestTitleById = new Map((diagTests ?? []).map(t => [t.id, t.title]))

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

  const unitById = new Map((units ?? []).map(u => [u.id, u]))
  const topicById = new Map((topics ?? []).map(t => [t.id, t]))
  const questionMeta = new Map((questions ?? []).map(q => [
    q.id,
    { title: q.title, topicTitle: topicById.get(q.topic_id)?.title ?? '' },
  ]))
  // Study Tracker below needs unitTitle + classId too (for grouping and for
  // linking a question to its live board); kept as a separate map rather
  // than widening `questionMeta` above so the existing Classes section's
  // shape (used in several places already) isn't disturbed.
  const trackerQuestionMeta = new Map<string, QuestionMeta>((questions ?? []).map(q => {
    const topic = topicById.get(q.topic_id)
    const unit = unitById.get(topic?.unit_id ?? '')
    return [q.id, {
      title: q.title,
      topicTitle: topic?.title ?? 'Unknown topic',
      unitTitle: unit?.title ?? 'Unknown unit',
      classId: unit?.class_id ?? '',
    }]
  }))

  // No .in('question_id', questionIds) filter here on purpose — as the
  // question bank grows past a few hundred rows, that filter alone builds a
  // request URL long enough for PostgREST to reject with a silent 400 (data
  // comes back null, and every downstream `allSubs ?? []` quietly renders as
  // empty instead of surfacing the failure). Fetching all submissions
  // unfiltered is cheap at this app's scale and matching against a specific
  // question still happens downstream via questionMeta/Map lookups.
  type Sub = { id: string; student_id: string; question_id: string; created_at: string; updated_at: string; canvas_data: string | null; text_answer: string | null }
  const { data: allSubs } = await supabase
    .from('submissions')
    .select('id, student_id, question_id, created_at, updated_at, canvas_data, text_answer')

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
    type: 'help' | 'submitted' | 'comment' | 'writing' | 'test_completed'
    questionTitle: string
    topicTitle: string
    at: string
  }

  const ACTIVITY_ICON: Record<StudentActivity['type'], string> = { help: '🙋', submitted: '✅', comment: '💬', writing: '✍️', test_completed: '🧪' }
  const ACTIVITY_LABEL: Record<StudentActivity['type'], string> = { help: 'needs help', submitted: 'finished', comment: 'commented', writing: 'writing', test_completed: 'completed a test' }

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
      if (n.type === 'test_completed') {
        consider({
          studentId: n.student_id, type: 'test_completed',
          questionTitle: diagTestTitleById.get(n.diagnostic_test_id ?? '') ?? 'a test', topicTitle: '',
          at: n.created_at,
        })
        continue
      }
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

  // Flat cross-class roster for Study Tracker below — reuses data already
  // fetched for the Classes section above instead of querying again.
  const classTitleById = new Map((classes ?? []).map(c => [c.id, c.title]))
  const classIdByStudentForTracker = new Map<string, string>()
  for (const e of classEnrollments ?? []) {
    if (!classIdByStudentForTracker.has(e.student_id)) classIdByStudentForTracker.set(e.student_id, e.class_id)
  }
  const trackerRoster: StudentInfo[] = (studentProfiles ?? [])
    .map(p => ({
      id: p.id,
      name: p.full_name,
      classTitle: classTitleById.get(classIdByStudentForTracker.get(p.id) ?? '') ?? 'Unknown class',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const trackerSubs: SubmissionForTracker[] = (allSubs ?? [])
    .filter(hasContent)
    .map(s => ({ id: s.id, student_id: s.student_id, question_id: s.question_id, created_at: s.created_at, updated_at: s.updated_at }))

  const { mode: modeParam, date: dateParam } = await searchParams
  const trackerMode = modeParam === 'week' ? 'week' : 'day'
  const trackerDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayISO()
  const dayReport: DayReport | null = trackerMode === 'day'
    ? computeDayReport(trackerDate, trackerRoster, trackerSubs, trackerQuestionMeta, gradeBySubmission)
    : null
  const weekReport: WeekReport | null = trackerMode === 'week'
    ? computeWeekReport(trackerDate, trackerRoster, trackerSubs, trackerQuestionMeta)
    : null

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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

      {/* Study Tracker — who's been working through questions, on what
          topics, and roughly how long, with day/week navigation. Scoped to
          the main class-content system (submissions), not Self Study or
          Tests, which have their own dashboards. */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Study Tracker</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <Link
              href={`?mode=day&date=${trackerDate}`}
              className={`text-sm font-semibold px-3 py-1 rounded-md transition-colors ${trackerMode === 'day' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Day
            </Link>
            <Link
              href={`?mode=week&date=${trackerDate}`}
              className={`text-sm font-semibold px-3 py-1 rounded-md transition-colors ${trackerMode === 'week' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Week
            </Link>
          </div>
        </div>
        {dayReport ? <DayTable report={dayReport} date={trackerDate} /> : <WeekTable report={weekReport!} />}
      </div>
    </div>
  )
}

function DayTable({ report, date }: { report: DayReport; date: string }) {
  const isToday = date === todayISO()
  const sorted = [...report.students].sort((a, b) => a.student.name.localeCompare(b.student.name))
  const active = sorted.filter(s => s.questions.length > 0)
  const inactive = sorted.filter(s => s.questions.length === 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
        <Link href={`?mode=day&date=${addDays(date, -1)}`} className="text-sm font-semibold text-purple-600 hover:underline">← {formatShort(addDays(date, -1))}</Link>
        <div className="text-center">
          <p className="font-bold text-gray-800">{formatDayLabel(date)}</p>
          {!isToday && <Link href={`?mode=day&date=${todayISO()}`} className="text-xs text-purple-600 hover:underline">Jump to today</Link>}
        </div>
        <Link href={`?mode=day&date=${addDays(date, 1)}`} className="text-sm font-semibold text-purple-600 hover:underline">{formatShort(addDays(date, 1))} →</Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-indigo-600">{report.totalStudentsActive}<span className="text-sm text-gray-400 font-normal">/{report.students.length}</span></div>
          <div className="text-xs text-gray-500 font-medium">Students active</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-green-600">{report.totalQuestionsAnswered}</div>
          <div className="text-xs text-gray-500 font-medium">Questions answered</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-blue-600">{report.topicCounts.length}</div>
          <div className="text-xs text-gray-500 font-medium">Topics touched</div>
        </div>
      </div>

      {report.topicCounts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Topics studied</h3>
          <div className="flex flex-wrap gap-2">
            {report.topicCounts.map(t => (
              <span key={`${t.unitTitle}:${t.topicTitle}`} className="text-xs font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                {t.topicTitle} <span className="text-purple-400">×{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {active.map(s => (
          <details key={s.student.id} className="group">
            <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
                  {s.student.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.student.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.student.classTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-xs">
                  {s.unitCounts.map(u => (
                    <span key={u.unitTitle} className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {u.unitTitle} · {u.count}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {s.questions.length} question{s.questions.length === 1 ? '' : 's'}{s.totalMinutes > 0 ? ` · ~${s.totalMinutes} min` : ''}
                </span>
                <span className="text-gray-300 text-xs group-open:rotate-180 transition-transform">▾</span>
              </div>
            </summary>
            <div className="px-4 pb-3 overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <th className="py-1.5 pr-3">Question</th>
                    <th className="py-1.5 pr-3">Unit / Topic</th>
                    <th className="py-1.5 pr-3 whitespace-nowrap">Saved</th>
                    <th className="py-1.5 pr-3 whitespace-nowrap">Duration</th>
                    <th className="py-1.5 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {s.questions.map(q => (
                    <tr key={q.questionId}>
                      <td className="py-1.5 pr-3">
                        <Link href={`/teacher/live/${q.classId}/${q.questionId}/${s.student.id}`} className="text-purple-600 hover:underline font-medium">
                          {q.questionTitle}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3 text-gray-500">{q.unitTitle} · {q.topicTitle}</td>
                      <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap">{formatTimeOfDay(q.updatedAt)}</td>
                      <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap">{durationLabel(q)}</td>
                      <td className="py-1.5 text-right">
                        {q.grade && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${SUB_GRADE_CLS[q.grade] ?? 'bg-gray-100 text-gray-500'}`}>{q.grade}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        {active.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No activity {isToday ? 'yet today' : 'that day'}.</p>}
      </div>

      {inactive.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">No activity ({inactive.length})</p>
          <p className="text-sm text-gray-500">{inactive.map(s => s.student.name).join(', ')}</p>
        </div>
      )}
    </div>
  )
}

function WeekTable({ report }: { report: WeekReport }) {
  const isThisWeek = report.weekStartISO === mondayISOOf(todayISO())
  const sorted = [...report.students].sort((a, b) => a.student.name.localeCompare(b.student.name))
  const active = sorted.filter(s => s.totalQuestions > 0)
  const inactive = sorted.filter(s => s.totalQuestions === 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
        <Link href={`?mode=week&date=${addDays(report.weekStartISO, -7)}`} className="text-sm font-semibold text-purple-600 hover:underline">← Prev week</Link>
        <div className="text-center">
          <p className="font-bold text-gray-800">Week of {formatShort(report.weekStartISO)} – {formatShort(report.weekEndISO)}</p>
          {!isThisWeek && <Link href={`?mode=week&date=${todayISO()}`} className="text-xs text-purple-600 hover:underline">Jump to this week</Link>}
        </div>
        <Link href={`?mode=week&date=${addDays(report.weekStartISO, 7)}`} className="text-sm font-semibold text-purple-600 hover:underline">Next week →</Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-indigo-600">{report.totalStudentsActive}<span className="text-sm text-gray-400 font-normal">/{report.students.length}</span></div>
          <div className="text-xs text-gray-500 font-medium">Students studied</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-green-600">{report.totalQuestionsAnswered}</div>
          <div className="text-xs text-gray-500 font-medium">Questions answered</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-blue-600">{report.topicCounts.length}</div>
          <div className="text-xs text-gray-500 font-medium">Topics touched</div>
        </div>
      </div>

      {report.topicCounts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Topics studied this week</h3>
          <div className="flex flex-wrap gap-2">
            {report.topicCounts.map(t => (
              <span key={`${t.unitTitle}:${t.topicTitle}`} className="text-xs font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                {t.topicTitle} <span className="text-purple-400">×{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {active.map(s => (
          <details key={s.student.id} className="group">
            <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
                  {s.student.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.student.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.student.classTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-xs">
                  {s.unitCounts.map(u => (
                    <span key={u.unitTitle} className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {u.unitTitle} · {u.count}
                    </span>
                  ))}
                </div>
                <div className="hidden md:flex items-center gap-1">
                  {s.dayCounts.map((count, di) => (
                    <div
                      key={di}
                      title={`${WEEKDAY_LETTERS[di]}: ${count} question${count === 1 ? '' : 's'}`}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                        count === 0 ? 'bg-gray-100 text-gray-300' : count < 3 ? 'bg-purple-200 text-purple-700' : 'bg-purple-500 text-white'
                      }`}
                    >
                      {count > 0 ? count : WEEKDAY_LETTERS[di]}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {s.totalQuestions} question{s.totalQuestions === 1 ? '' : 's'} · {s.activeDays.length}/7 days
                </span>
                <span className="text-gray-300 text-xs group-open:rotate-180 transition-transform">▾</span>
              </div>
            </summary>
            <div className="px-4 pb-3 overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <th className="py-1.5 pr-3">Question</th>
                    <th className="py-1.5 pr-3">Unit / Topic</th>
                    <th className="py-1.5 pr-3 whitespace-nowrap">Saved</th>
                    <th className="py-1.5 pr-3 whitespace-nowrap">Duration</th>
                    <th className="py-1.5 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {s.questions.map(q => (
                    <tr key={q.questionId}>
                      <td className="py-1.5 pr-3">
                        <Link href={`/teacher/live/${q.classId}/${q.questionId}/${s.student.id}`} className="text-purple-600 hover:underline font-medium">
                          {q.questionTitle}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3 text-gray-500">{q.unitTitle} · {q.topicTitle}</td>
                      <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap">{formatTimeOfDay(q.updatedAt)}</td>
                      <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap">{durationLabel(q)}</td>
                      <td className="py-1.5 text-right">
                        {q.grade && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${SUB_GRADE_CLS[q.grade] ?? 'bg-gray-100 text-gray-500'}`}>{q.grade}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        {active.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No activity {isThisWeek ? 'yet this week' : 'that week'}.</p>}
      </div>

      {inactive.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">No activity ({inactive.length})</p>
          <p className="text-sm text-gray-500">{inactive.map(s => s.student.name).join(', ')}</p>
        </div>
      )}
    </div>
  )
}
