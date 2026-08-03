import { createAdminClient } from './supabase/server'

// A day/week roll-up of "who worked on what" for the main class-content
// system (classes -> units -> topics -> questions -> submissions). Self
// Study (practice_attempts) and Tests (diagnostic_attempts) are separate
// systems with their own dashboards and aren't mixed in here.
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

export interface QuestionActivity {
  questionId: string
  questionTitle: string
  topicTitle: string
  unitTitle: string
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

export interface StudentDayActivity {
  student: StudentInfo
  questions: QuestionActivity[]
  totalMinutes: number
}

export interface TopicCount {
  topicTitle: string
  unitTitle: string
  count: number
}

interface RawSubmission {
  id: string
  student_id: string
  question_id: string
  canvas_data: string | null
  text_answer: string | null
  created_at: string
  updated_at: string
}

function hasContent(s: RawSubmission): boolean {
  return (!!s.canvas_data && s.canvas_data.length > 5) || (!!s.text_answer && s.text_answer.trim().length > 0)
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

// Shared roster + content-tree lookup, used by both day and week views.
async function loadRosterAndContentTree() {
  const admin = await createAdminClient()

  const { data: classes } = await admin.from('classes').select('id, title')
  const classIds = (classes ?? []).map(c => c.id)
  const classTitleById = new Map((classes ?? []).map(c => [c.id, c.title]))

  const { data: enrollments } = classIds.length > 0
    ? await admin.from('class_enrollments').select('student_id, class_id').in('class_id', classIds)
    : { data: [] as { student_id: string; class_id: string }[] }
  const classIdByStudent = new Map((enrollments ?? []).map(e => [e.student_id, e.class_id]))

  const studentIds = [...new Set((enrollments ?? []).map(e => e.student_id))]
  const { data: profiles } = studentIds.length > 0
    ? await admin.from('profiles').select('id, full_name').in('id', studentIds)
    : { data: [] as { id: string; full_name: string }[] }

  const roster: StudentInfo[] = (profiles ?? [])
    .map(p => ({
      id: p.id,
      name: p.full_name,
      classTitle: classTitleById.get(classIdByStudent.get(p.id) ?? '') ?? 'Unknown class',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const { data: units } = classIds.length > 0
    ? await admin.from('units').select('id, title, class_id').in('class_id', classIds)
    : { data: [] as { id: string; title: string; class_id: string }[] }
  const unitIds = (units ?? []).map(u => u.id)
  const { data: topics } = unitIds.length > 0
    ? await admin.from('topics').select('id, title, unit_id').in('unit_id', unitIds)
    : { data: [] as { id: string; title: string; unit_id: string }[] }
  const topicIds = (topics ?? []).map(t => t.id)
  const { data: questions } = topicIds.length > 0
    ? await admin.from('questions').select('id, title, topic_id').in('topic_id', topicIds)
    : { data: [] as { id: string; title: string; topic_id: string }[] }

  const unitTitleById = new Map((units ?? []).map(u => [u.id, u.title]))
  const topicById = new Map((topics ?? []).map(t => [t.id, t]))
  const questionMeta = new Map((questions ?? []).map(q => [
    q.id,
    {
      title: q.title,
      topicTitle: topicById.get(q.topic_id)?.title ?? 'Unknown topic',
      unitTitle: unitTitleById.get(topicById.get(q.topic_id)?.unit_id ?? '') ?? 'Unknown unit',
    },
  ]))

  return { admin, roster, questionMeta }
}

async function loadSubmissionsInRange(admin: Awaited<ReturnType<typeof createAdminClient>>, start: Date, end: Date) {
  const { data } = await admin
    .from('submissions')
    .select('id, student_id, question_id, canvas_data, text_answer, created_at, updated_at')
    .gte('updated_at', start.toISOString())
    .lt('updated_at', end.toISOString())
  return ((data ?? []) as RawSubmission[]).filter(hasContent)
}

async function loadGrades(admin: Awaited<ReturnType<typeof createAdminClient>>, submissionIds: string[]) {
  const { data } = submissionIds.length > 0
    ? await admin.from('feedback').select('submission_id, grade').in('submission_id', submissionIds)
    : { data: [] as { submission_id: string; grade: string | null }[] }
  return new Map((data ?? []).map(f => [f.submission_id, f.grade]))
}

export interface DayReport {
  date: string
  students: StudentDayActivity[]
  topicCounts: TopicCount[]
  totalQuestionsAnswered: number
  totalStudentsActive: number
}

export async function getDayReport(dateISO: string): Promise<DayReport> {
  const dayStart = new Date(`${dateISO}T00:00:00.000Z`)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  const { admin, roster, questionMeta } = await loadRosterAndContentTree()
  const subs = await loadSubmissionsInRange(admin, dayStart, dayEnd)
  const gradeBySubmission = await loadGrades(admin, subs.map(s => s.id))

  const byStudent = new Map<string, QuestionActivity[]>()
  const topicCountMap = new Map<string, TopicCount>()

  for (const s of subs) {
    const meta = questionMeta.get(s.question_id)
    if (!meta) continue
    const { minutes, continuedFromEarlier } = estimateMinutes(s.created_at, s.updated_at)
    const entry: QuestionActivity = {
      questionId: s.question_id,
      questionTitle: meta.title,
      topicTitle: meta.topicTitle,
      unitTitle: meta.unitTitle,
      updatedAt: s.updated_at,
      estimatedMinutes: minutes,
      continuedFromEarlier,
      grade: gradeBySubmission.get(s.id) ?? null,
    }
    if (!byStudent.has(s.student_id)) byStudent.set(s.student_id, [])
    byStudent.get(s.student_id)!.push(entry)

    const topicKey = `${meta.unitTitle} :: ${meta.topicTitle}`
    const existing = topicCountMap.get(topicKey) ?? { topicTitle: meta.topicTitle, unitTitle: meta.unitTitle, count: 0 }
    existing.count += 1
    topicCountMap.set(topicKey, existing)
  }

  const students: StudentDayActivity[] = roster.map(student => {
    const questions = (byStudent.get(student.id) ?? []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const totalMinutes = questions.reduce((sum, q) => sum + (q.estimatedMinutes ?? 0), 0)
    return { student, questions, totalMinutes }
  }).sort((a, b) => b.questions.length - a.questions.length || a.student.name.localeCompare(b.student.name))

  const topicCounts = [...topicCountMap.values()].sort((a, b) => b.count - a.count)

  return {
    date: dateISO,
    students,
    topicCounts,
    totalQuestionsAnswered: subs.length,
    totalStudentsActive: students.filter(s => s.questions.length > 0).length,
  }
}

export interface StudentWeekActivity {
  student: StudentInfo
  totalQuestions: number
  activeDays: string[] // ISO dates (YYYY-MM-DD) with at least one answer, sorted
  dayCounts: number[] // length 7, Mon..Sun, count of questions per day
  topicsTouched: TopicCount[]
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

export async function getWeekReport(anchorDateISO: string): Promise<WeekReport> {
  const weekStart = mondayOf(anchorDateISO)
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { admin, roster, questionMeta } = await loadRosterAndContentTree()
  const subs = await loadSubmissionsInRange(admin, weekStart, weekEnd)

  const byStudent = new Map<string, RawSubmission[]>()
  const topicCountMap = new Map<string, TopicCount>()
  for (const s of subs) {
    if (!byStudent.has(s.student_id)) byStudent.set(s.student_id, [])
    byStudent.get(s.student_id)!.push(s)
    const meta = questionMeta.get(s.question_id)
    if (!meta) continue
    const topicKey = `${meta.unitTitle} :: ${meta.topicTitle}`
    const existing = topicCountMap.get(topicKey) ?? { topicTitle: meta.topicTitle, unitTitle: meta.unitTitle, count: 0 }
    existing.count += 1
    topicCountMap.set(topicKey, existing)
  }

  const students: StudentWeekActivity[] = roster.map(student => {
    const studentSubs = byStudent.get(student.id) ?? []
    const activeDaySet = new Set<string>()
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]
    const topicMap = new Map<string, TopicCount>()
    for (const s of studentSubs) {
      const d = new Date(s.updated_at)
      activeDaySet.add(toISODate(d))
      const dayIndex = Math.floor((d.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
      if (dayIndex >= 0 && dayIndex < 7) dayCounts[dayIndex] += 1
      const meta = questionMeta.get(s.question_id)
      if (!meta) continue
      const topicKey = `${meta.unitTitle} :: ${meta.topicTitle}`
      const existing = topicMap.get(topicKey) ?? { topicTitle: meta.topicTitle, unitTitle: meta.unitTitle, count: 0 }
      existing.count += 1
      topicMap.set(topicKey, existing)
    }
    return {
      student,
      totalQuestions: studentSubs.length,
      activeDays: [...activeDaySet].sort(),
      dayCounts,
      topicsTouched: [...topicMap.values()].sort((a, b) => b.count - a.count),
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
