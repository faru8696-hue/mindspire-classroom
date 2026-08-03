// A day/week roll-up of "who worked on what" for the main class-content
// system (classes -> units -> topics -> questions -> submissions). Self
// Study (practice_attempts) and Tests (diagnostic_attempts) are separate
// systems with their own dashboards and aren't mixed in here.
//
// Pure aggregation only — no Supabase I/O. This lives on the teacher
// dashboard, which already fetches classes/enrollments/profiles/units/
// topics/questions/submissions for its own "Classes" section; re-querying
// all of that a second time here (as an earlier version of this file did)
// roughly doubled the page's round-trips and made it noticeably slow to
// load. The caller passes in what it already has.
//
// Important limitation: `submissions` is one row per (student, question),
// upserted on every autosave — there's no append-only activity log. So a
// question a student first opened last week and touched again today only
// shows up under TODAY (its updated_at), and there's no way to recover which
// earlier days they also worked on it. This is fine for "who's active
// today/this week" and "how many questions," but it means a student can't be
// double-counted across days for the same question, and the per-question
// time estimate below only makes sense when the whole session happened
// within one day.

export interface StudentInfo {
  id: string
  name: string
  classTitle: string
}

export interface QuestionMeta {
  title: string
  topicTitle: string
  unitTitle: string
  classId: string
}

export interface SubmissionForTracker {
  id: string
  student_id: string
  question_id: string
  created_at: string
  updated_at: string
}

export interface QuestionActivity {
  questionId: string
  questionTitle: string
  topicTitle: string
  unitTitle: string
  classId: string
  updatedAt: string
  // Minutes between first save (created_at) and last save (updated_at) on
  // this question, but ONLY when both happened on the same calendar day and
  // the gap is under 3 hours — otherwise there's no honest way to tell how
  // much of that gap was actual work vs. the tab just sitting open, so it's
  // left null rather than showing a made-up number.
  estimatedMinutes: number | null
  continuedFromEarlier: boolean
  grade: string | null
}

export interface UnitCount {
  unitTitle: string
  count: number
}

export interface StudentDayActivity {
  student: StudentInfo
  questions: QuestionActivity[]
  totalMinutes: number
  unitCounts: UnitCount[]
}

export interface TopicCount {
  topicTitle: string
  unitTitle: string
  count: number
}

function estimateMinutes(createdAt: string, updatedAt: string): { minutes: number | null; continuedFromEarlier: boolean } {
  const start = new Date(createdAt)
  const end = new Date(updatedAt)
  const continuedFromEarlier = start.toDateString() !== end.toDateString()
  if (continuedFromEarlier) return { minutes: null, continuedFromEarlier: true }
  const minutes = (end.getTime() - start.getTime()) / 60000
  if (minutes > 180) return { minutes: null, continuedFromEarlier: false }
  return { minutes: Math.round(minutes), continuedFromEarlier: false }
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t < end.getTime()
}

function bumpTopicCount(map: Map<string, TopicCount>, meta: QuestionMeta) {
  const key = `${meta.unitTitle} :: ${meta.topicTitle}`
  const existing = map.get(key) ?? { topicTitle: meta.topicTitle, unitTitle: meta.unitTitle, count: 0 }
  existing.count += 1
  map.set(key, existing)
}

function unitCountsFrom(questions: { unitTitle: string }[]): UnitCount[] {
  const map = new Map<string, number>()
  for (const q of questions) map.set(q.unitTitle, (map.get(q.unitTitle) ?? 0) + 1)
  return [...map.entries()].map(([unitTitle, count]) => ({ unitTitle, count })).sort((a, b) => b.count - a.count)
}

function buildQuestionActivity(s: SubmissionForTracker, meta: QuestionMeta, gradeBySubmission?: Map<string, string | null>): QuestionActivity {
  const { minutes, continuedFromEarlier } = estimateMinutes(s.created_at, s.updated_at)
  return {
    questionId: s.question_id,
    questionTitle: meta.title,
    topicTitle: meta.topicTitle,
    unitTitle: meta.unitTitle,
    classId: meta.classId,
    updatedAt: s.updated_at,
    estimatedMinutes: minutes,
    continuedFromEarlier,
    grade: gradeBySubmission?.get(s.id) ?? null,
  }
}

export interface DayReport {
  date: string
  students: StudentDayActivity[]
  topicCounts: TopicCount[]
  totalQuestionsAnswered: number
  totalStudentsActive: number
}

export function computeDayReport(
  dateISO: string,
  roster: StudentInfo[],
  submissions: SubmissionForTracker[],
  questionMeta: Map<string, QuestionMeta>,
  gradeBySubmission: Map<string, string | null>
): DayReport {
  const dayStart = new Date(`${dateISO}T00:00:00.000Z`)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const subs = submissions.filter(s => inRange(s.updated_at, dayStart, dayEnd))

  const byStudent = new Map<string, QuestionActivity[]>()
  const topicCountMap = new Map<string, TopicCount>()

  for (const s of subs) {
    const meta = questionMeta.get(s.question_id)
    if (!meta) continue
    const entry = buildQuestionActivity(s, meta, gradeBySubmission)
    if (!byStudent.has(s.student_id)) byStudent.set(s.student_id, [])
    byStudent.get(s.student_id)!.push(entry)
    bumpTopicCount(topicCountMap, meta)
  }

  const students: StudentDayActivity[] = roster.map(student => {
    const questions = (byStudent.get(student.id) ?? []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const totalMinutes = questions.reduce((sum, q) => sum + (q.estimatedMinutes ?? 0), 0)
    return { student, questions, totalMinutes, unitCounts: unitCountsFrom(questions) }
  }).sort((a, b) => b.questions.length - a.questions.length || a.student.name.localeCompare(b.student.name))

  return {
    date: dateISO,
    students,
    topicCounts: [...topicCountMap.values()].sort((a, b) => b.count - a.count),
    totalQuestionsAnswered: subs.length,
    totalStudentsActive: students.filter(s => s.questions.length > 0).length,
  }
}

export interface StudentWeekActivity {
  student: StudentInfo
  questions: QuestionActivity[]
  totalQuestions: number
  activeDays: string[] // ISO dates (YYYY-MM-DD) with at least one answer, sorted
  dayCounts: number[] // length 7, Mon..Sun, count of questions per day
  unitCounts: UnitCount[]
}

export interface WeekReport {
  weekStartISO: string // Monday
  weekEndISO: string // Sunday (inclusive)
  students: StudentWeekActivity[]
  topicCounts: TopicCount[]
  totalQuestionsAnswered: number
  totalStudentsActive: number
}

function mondayOf(dateISO: string): Date {
  const d = new Date(`${dateISO}T00:00:00.000Z`)
  const day = d.getUTCDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function computeWeekReport(
  anchorDateISO: string,
  roster: StudentInfo[],
  submissions: SubmissionForTracker[],
  questionMeta: Map<string, QuestionMeta>
): WeekReport {
  const weekStart = mondayOf(anchorDateISO)
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  const subs = submissions.filter(s => inRange(s.updated_at, weekStart, weekEnd))

  const byStudent = new Map<string, QuestionActivity[]>()
  const topicCountMap = new Map<string, TopicCount>()
  for (const s of subs) {
    const meta = questionMeta.get(s.question_id)
    if (!meta) continue
    const entry = buildQuestionActivity(s, meta)
    if (!byStudent.has(s.student_id)) byStudent.set(s.student_id, [])
    byStudent.get(s.student_id)!.push(entry)
    bumpTopicCount(topicCountMap, meta)
  }

  const students: StudentWeekActivity[] = roster.map(student => {
    const questions = (byStudent.get(student.id) ?? []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const activeDaySet = new Set<string>()
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]
    for (const q of questions) {
      const d = new Date(q.updatedAt)
      activeDaySet.add(toISODate(d))
      const dayIndex = Math.floor((d.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
      if (dayIndex >= 0 && dayIndex < 7) dayCounts[dayIndex] += 1
    }
    return {
      student,
      questions,
      totalQuestions: questions.length,
      activeDays: [...activeDaySet].sort(),
      dayCounts,
      unitCounts: unitCountsFrom(questions),
    }
  }).sort((a, b) => b.totalQuestions - a.totalQuestions || a.student.name.localeCompare(b.student.name))

  return {
    weekStartISO: toISODate(weekStart),
    weekEndISO: toISODate(new Date(weekEnd.getTime() - 24 * 60 * 60 * 1000)),
    students,
    topicCounts: [...topicCountMap.values()].sort((a, b) => b.count - a.count),
    totalQuestionsAnswered: subs.length,
    totalStudentsActive: students.filter(s => s.totalQuestions > 0).length,
  }
}
