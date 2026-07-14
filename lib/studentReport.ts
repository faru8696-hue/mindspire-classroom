import { SupabaseClient } from '@supabase/supabase-js'

// Numeric rank so we can detect improvement (higher = better). 'discussed' is a
// conversation marker, not a performance level, so it's excluded from scoring.
const RANK: Record<string, number> = { incorrect: 0, needsmore: 1, partial: 2, correct: 3 }
// Mastery weight per latest grade: correct = full, partial = half, rest = 0.
const WEIGHT: Record<string, number> = { correct: 1, partial: 0.5, incorrect: 0, needsmore: 0 }

export interface TopicStat { id: string; title: string; graded: number; score: number; total: number; pct: number }
export interface Improvement { questionId: string; title: string; from: string; to: string; date: string }
export interface StruggleItem {
  questionId: string
  questionTitle: string
  questionContent: string | null
  answerKey: string | null
  topicTitle: string
  grade: string | null
  canvasData: string | null
  teacherCanvasData: string | null
  textAnswer: string | null
  teacherComment: string | null
  updatedAt: string
}

export interface TrendPoint { date: string; pct: number; cumulativeGraded: number }
export interface TopicComparison { topicId: string; title: string; studentPct: number; classAvgPct: number; classSize: number }
export interface ClassComparison { classAvgOverallPct: number; classSize: number; perTopic: TopicComparison[] }
export interface ClassBreakdown {
  classId: string
  className: string
  overallPct: number
  correct: number
  partial: number
  incorrect: number
  graded: number
  role: 'foundational' | 'advanced' | null // set when dual-enrolled in a Honors + AP pairing
}

export interface StudentReportData {
  student: { id: string; full_name: string; nickname: string | null; grade_level: string | null }
  enrolledClasses: { id: string; title: string }[]
  overallPct: number
  correct: number
  partial: number
  incorrect: number
  graded: number
  masteryRows: TopicStat[]
  improvements: Improvement[]
  totalEvents: number
  firstDate: string | null
  lastDate: string | null
  struggleItems: StruggleItem[]
  trend: TrendPoint[]
  daysActive: number
  submissionsLast14Days: number
  classBreakdown: ClassBreakdown[]
  isFoundationalAdvancedPairing: boolean // true when enrolled in both an Honors/foundational class and an AP/advanced class
  // Internal fields carried through so computeClassComparison doesn't have to
  // re-derive them from scratch (avoids re-running the same heavy queries).
  _assignedQs: { id: string; topic_id: string }[]
  _topicMeta: Map<string, { id: string; title: string }>
  _enrolledClassIds: string[]
}

// Shared by the teacher-facing report page and the parent-email route, so
// the two never compute mastery/struggle data differently.
export async function computeStudentReport(supabase: SupabaseClient, studentId: string): Promise<StudentReportData | null> {
  const { data: student } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, grade_level')
    .eq('id', studentId)
    .single()
  if (!student) return null

  const { data: studentEnrollments } = await supabase
    .from('class_enrollments')
    .select('class_id, classes(id, title)')
    .eq('student_id', studentId)
  const enrolledClasses = (studentEnrollments ?? []).map((e: { class_id: string; classes: { id: string; title: string } | { id: string; title: string }[] | null }) => {
    const c = e.classes; return Array.isArray(c) ? c[0] : c
  }).filter(Boolean) as { id: string; title: string }[]
  const enrolledClassIds = enrolledClasses.map(c => c.id)

  const { data: units } = enrolledClassIds.length > 0
    ? await supabase.from('units').select('id, title, order_index, class_id').in('class_id', enrolledClassIds).order('order_index')
    : { data: [] }
  const unitIds = units?.map((u: { id: string }) => u.id) ?? []
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, title, unit_id, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }
  const topicIds = topics?.map((t: { id: string }) => t.id) ?? []
  const { data: questions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, title, content, answer_key, topic_id').in('topic_id', topicIds)
    : { data: [] }
  const questionIds = questions?.map((q: { id: string }) => q.id) ?? []

  const { data: assignments } = enrolledClassIds.length > 0 && questionIds.length > 0
    ? await supabase.from('assignments').select('question_id').in('class_id', enrolledClassIds)
    : { data: [] }
  const assignedSet = assignments && assignments.length > 0
    ? new Set(assignments.map((a: { question_id: string }) => a.question_id))
    : null

  // No .in('question_id', questionIds) filter here — a student enrolled in
  // multiple classes can have a combined question bank well past the point
  // where PostgREST rejects the request URL as too long (this exact bug hit
  // the Progress/Dashboard/Class pages once the DB crossed ~600 questions;
  // see the fix there). The student_id filter alone keeps this bounded, and
  // matching against a specific question still happens downstream via the
  // qMeta/latestGradeByQuestion lookups, so the extra rows for questions
  // outside this student's enrolled classes are simply never read.
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, question_id, canvas_data, text_answer, updated_at')
    .eq('student_id', studentId)
  const submissionIds = submissions?.map((s: { id: string }) => s.id) ?? []
  const { data: feedbacks } = submissionIds.length > 0
    ? await supabase.from('feedback').select('submission_id, grade, canvas_data, text_feedback').in('submission_id', submissionIds)
    : { data: [] }
  const feedbackBySubmission = new Map(feedbacks?.map((f: { submission_id: string; grade: string | null; canvas_data: string | null; text_feedback: string | null }) => [f.submission_id, f]))
  const latestGradeByQuestion = new Map<string, string | null>()
  for (const s of submissions ?? []) latestGradeByQuestion.set(s.question_id, feedbackBySubmission.get(s.id)?.grade ?? null)

  const { data: history } = await supabase
    .from('grade_history')
    .select('question_id, grade, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true })

  const qMeta = new Map((questions ?? []).map((q: { id: string; title: string; content: string | null; answer_key: string | null; topic_id: string }) => [q.id, q]))
  const topicMeta = new Map((topics ?? []).map((t: { id: string; title: string }) => [t.id, t]))

  // topic -> unit -> class, so per-question mastery can be attributed to a
  // specific enrolled class (needed for the class breakdown below).
  const unitClassById = new Map((units ?? []).map((u: { id: string; class_id: string }) => [u.id, u.class_id]))
  const classIdByTopicId = new Map(
    (topics ?? []).map((t: { id: string; unit_id: string }) => [t.id, unitClassById.get(t.unit_id) as string | undefined])
  )

  const assignedQs = assignedSet ? (questions ?? []).filter((q: { id: string }) => assignedSet.has(q.id)) : (questions ?? [])
  const topicStats = new Map<string, { id: string; title: string; graded: number; score: number; total: number }>()
  for (const q of assignedQs) {
    const t = topicMeta.get(q.topic_id) as { id: string; title: string } | undefined
    if (!t) continue
    if (!topicStats.has(t.id)) topicStats.set(t.id, { id: t.id, title: t.title, graded: 0, score: 0, total: 0 })
    const ts = topicStats.get(t.id)!
    ts.total++
    const g = latestGradeByQuestion.get(q.id)
    if (g && g in WEIGHT) { ts.graded++; ts.score += WEIGHT[g] }
  }
  const masteryRows: TopicStat[] = [...topicStats.values()]
    .filter(t => t.graded > 0)
    .map(t => ({ ...t, pct: Math.round((t.score / t.graded) * 100) }))
    .sort((a, b) => a.pct - b.pct) // worst first — most useful for a struggle-focused report

  let correct = 0, partial = 0, incorrect = 0, graded = 0
  for (const q of assignedQs) {
    const g = latestGradeByQuestion.get(q.id)
    if (!g) continue
    if (g === 'correct') { correct++; graded++ }
    else if (g === 'partial') { partial++; graded++ }
    else if (g === 'incorrect' || g === 'needsmore') { incorrect++; graded++ }
  }
  const overallPct = graded > 0 ? Math.round(((correct + partial * 0.5) / graded) * 100) : 0

  // ── Per-class breakdown ───────────────────────────────────────────
  // A student can be enrolled in more than one class (most commonly: Honors
  // Chemistry as a foundational class alongside AP Chemistry, when they're
  // taking AP without the usual prior-chemistry prerequisite). Splitting
  // mastery by class lets the report compare "how are they doing building
  // the foundation" vs. "how are they doing in the advanced class" instead
  // of blending both into one misleading combined percentage.
  const classStatAccum = new Map<string, { correct: number; partial: number; incorrect: number; graded: number }>()
  for (const q of assignedQs) {
    const classId = classIdByTopicId.get(q.topic_id)
    if (!classId) continue
    if (!classStatAccum.has(classId)) classStatAccum.set(classId, { correct: 0, partial: 0, incorrect: 0, graded: 0 })
    const acc = classStatAccum.get(classId)!
    const g = latestGradeByQuestion.get(q.id)
    if (!g) continue
    if (g === 'correct') { acc.correct++; acc.graded++ }
    else if (g === 'partial') { acc.partial++; acc.graded++ }
    else if (g === 'incorrect' || g === 'needsmore') { acc.incorrect++; acc.graded++ }
  }

  const isHonorsLike = (title: string) => /honors/i.test(title)
  const isApLike = (title: string) => /\bap\b/i.test(title)
  const hasFoundational = enrolledClasses.some(c => isHonorsLike(c.title))
  const hasAdvanced = enrolledClasses.some(c => isApLike(c.title))
  const isFoundationalAdvancedPairing = hasFoundational && hasAdvanced

  const classBreakdown: ClassBreakdown[] = enrolledClasses.map(c => {
    const acc = classStatAccum.get(c.id) ?? { correct: 0, partial: 0, incorrect: 0, graded: 0 }
    const pct = acc.graded > 0 ? Math.round(((acc.correct + acc.partial * 0.5) / acc.graded) * 100) : 0
    const role: ClassBreakdown['role'] = isFoundationalAdvancedPairing
      ? (isHonorsLike(c.title) ? 'foundational' : isApLike(c.title) ? 'advanced' : null)
      : null
    return {
      classId: c.id, className: c.title, overallPct: pct,
      correct: acc.correct, partial: acc.partial, incorrect: acc.incorrect, graded: acc.graded,
      role,
    }
  })

  const byQuestion = new Map<string, { grade: string; created_at: string }[]>()
  for (const h of history ?? []) {
    if (!byQuestion.has(h.question_id)) byQuestion.set(h.question_id, [])
    byQuestion.get(h.question_id)!.push({ grade: h.grade, created_at: h.created_at })
  }
  const improvements: Improvement[] = []
  for (const [qid, evs] of byQuestion) {
    if (evs.length < 2) continue
    const first = evs[0], last = evs[evs.length - 1]
    const fr = RANK[first.grade], lr = RANK[last.grade]
    if (fr === undefined || lr === undefined) continue
    if (lr > fr) {
      improvements.push({
        questionId: qid,
        title: (qMeta.get(qid) as { title?: string } | undefined)?.title ?? 'Question',
        from: first.grade, to: last.grade, date: last.created_at,
      })
    }
  }
  improvements.sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const totalEvents = (history ?? []).length
  const firstDate = history && history.length > 0 ? history[0].created_at : null
  const lastDate = history && history.length > 0 ? history[history.length - 1].created_at : null

  // ── Trend: rolling accuracy over time ────────────────────────────
  // Replay grade_history in order, tracking the LATEST grade per question at
  // each point, and sample the running accuracy once per calendar day so a
  // student with many same-day regrades doesn't produce a noisy trend line.
  const trend: TrendPoint[] = []
  if (history && history.length > 0) {
    const runningGrade = new Map<string, string>()
    let lastSampledDay = ''
    for (const h of history) {
      runningGrade.set(h.question_id, h.grade)
      const day = h.created_at.slice(0, 10)
      const isLastEvent = h === history[history.length - 1]
      if (day !== lastSampledDay || isLastEvent) {
        let score = 0, gradedCount = 0
        for (const g of runningGrade.values()) {
          if (g in WEIGHT) { score += WEIGHT[g]; gradedCount++ }
        }
        const pct = gradedCount > 0 ? Math.round((score / gradedCount) * 100) : 0
        trend.push({ date: day, pct, cumulativeGraded: gradedCount })
        lastSampledDay = day
      }
    }
  }

  // ── Engagement: simple activity signals ──────────────────────────
  const activeDays = new Set((history ?? []).map((h: { created_at: string }) => h.created_at.slice(0, 10)))
  const daysActive = activeDays.size
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
  const submissionsLast14Days = (submissions ?? []).filter((s: { updated_at: string }) => +new Date(s.updated_at) >= fourteenDaysAgo).length

  // Struggle items: latest submission per question where the grade shows
  // difficulty (incorrect/needsmore/partial), or the question was submitted
  // but never graded — these are exactly the cases worth a deep AI look at
  // the actual work, not just a percentage. Most recent first, capped so the
  // AI report request stays a reasonable size.
  const struggleItems: StruggleItem[] = (submissions ?? [])
    .map((s: { id: string; question_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }) => {
      const fb = feedbackBySubmission.get(s.id) as { grade: string | null; canvas_data: string | null; text_feedback: string | null } | undefined
      const q = qMeta.get(s.question_id) as { id: string; title: string; content: string | null; answer_key: string | null; topic_id: string } | undefined
      if (!q) return null
      const grade = fb?.grade ?? null
      const isStruggle = !grade || grade === 'incorrect' || grade === 'needsmore' || grade === 'partial'
      if (!isStruggle) return null
      const t = topicMeta.get(q.topic_id) as { title?: string } | undefined
      return {
        questionId: q.id,
        questionTitle: q.title,
        questionContent: q.content,
        answerKey: q.answer_key,
        topicTitle: t?.title ?? '',
        grade,
        canvasData: s.canvas_data,
        teacherCanvasData: fb?.canvas_data ?? null,
        textAnswer: s.text_answer,
        teacherComment: fb?.text_feedback ?? null,
        updatedAt: s.updated_at,
      } as StruggleItem
    })
    .filter((x: StruggleItem | null): x is StruggleItem => x !== null)
    .sort((a: StruggleItem, b: StruggleItem) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 20)

  return {
    student,
    enrolledClasses,
    overallPct, correct, partial, incorrect, graded,
    masteryRows: masteryRows.sort((a, b) => b.pct - a.pct), // display order: best first, like before
    improvements,
    totalEvents, firstDate, lastDate,
    struggleItems,
    trend,
    daysActive,
    submissionsLast14Days,
    classBreakdown,
    isFoundationalAdvancedPairing,
    _assignedQs: assignedQs.map((q: { id: string; topic_id: string }) => ({ id: q.id, topic_id: q.topic_id })),
    _topicMeta: topicMeta as Map<string, { id: string; title: string }>,
    _enrolledClassIds: enrolledClassIds,
  }
}

// Computes how the rest of the class is doing on the SAME assigned questions
// this student has (from computeStudentReport's _assignedQs/_topicMeta), so
// the deep report can say "ahead of classmates here" / "this topic is hard
// for everyone, not just you" instead of only reporting the student in
// isolation. Deliberately excludes the student themselves from the average.
export async function computeClassComparison(
  supabase: SupabaseClient,
  report: StudentReportData,
): Promise<ClassComparison | null> {
  const { _assignedQs: assignedQs, _topicMeta: topicMeta, _enrolledClassIds: enrolledClassIds, student } = report
  if (enrolledClassIds.length === 0 || assignedQs.length === 0) return null

  const { data: enrollments } = await supabase
    .from('class_enrollments')
    .select('student_id')
    .in('class_id', enrolledClassIds)
  const classmateIds = [...new Set((enrollments ?? []).map((e: { student_id: string }) => e.student_id))]
    .filter(id => id !== student.id)
  if (classmateIds.length === 0) return null

  // No .in('question_id', ...) filter — same reasoning as computeStudentReport:
  // combined with a potentially large classmateIds list this can build a URL
  // PostgREST rejects. student_id (via .in on a bounded classmate list) alone
  // keeps this safe; matching to assignedQs happens downstream via Set/Map.
  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, student_id, question_id')
    .in('student_id', classmateIds)
  const submissionIds = (submissions ?? []).map((s: { id: string }) => s.id)

  // Chunk the feedback lookup defensively — a large class with lots of
  // history could still push submissionIds itself past a safe URL length.
  const CHUNK = 200
  const feedbackBySubmission = new Map<string, string | null>()
  for (let i = 0; i < submissionIds.length; i += CHUNK) {
    const chunk = submissionIds.slice(i, i + CHUNK)
    if (chunk.length === 0) continue
    const { data: fbChunk } = await supabase.from('feedback').select('submission_id, grade').in('submission_id', chunk)
    for (const f of fbChunk ?? []) feedbackBySubmission.set(f.submission_id, f.grade)
  }

  const assignedQIds = new Set(assignedQs.map(q => q.id))
  const topicByQuestion = new Map(assignedQs.map(q => [q.id, q.topic_id]))

  // studentId -> topicId -> { score, graded }
  const perStudentTopic = new Map<string, Map<string, { score: number; graded: number }>>()
  // studentId -> { score, graded } overall
  const perStudentOverall = new Map<string, { score: number; graded: number }>()

  for (const s of submissions ?? []) {
    if (!assignedQIds.has(s.question_id)) continue
    const grade = feedbackBySubmission.get(s.id)
    if (!grade || !(grade in WEIGHT)) continue
    const topicId = topicByQuestion.get(s.question_id)
    if (!topicId) continue

    if (!perStudentOverall.has(s.student_id)) perStudentOverall.set(s.student_id, { score: 0, graded: 0 })
    const overall = perStudentOverall.get(s.student_id)!
    overall.score += WEIGHT[grade]; overall.graded++

    if (!perStudentTopic.has(s.student_id)) perStudentTopic.set(s.student_id, new Map())
    const byTopic = perStudentTopic.get(s.student_id)!
    if (!byTopic.has(topicId)) byTopic.set(topicId, { score: 0, graded: 0 })
    const t = byTopic.get(topicId)!
    t.score += WEIGHT[grade]; t.graded++
  }

  const overallPcts = [...perStudentOverall.values()].filter(v => v.graded > 0).map(v => (v.score / v.graded) * 100)
  const classAvgOverallPct = overallPcts.length > 0 ? Math.round(overallPcts.reduce((a, b) => a + b, 0) / overallPcts.length) : 0

  const perTopic: TopicComparison[] = []
  for (const t of report.masteryRows) {
    const classPctsForTopic: number[] = []
    for (const byTopic of perStudentTopic.values()) {
      const ts = byTopic.get(t.id)
      if (ts && ts.graded > 0) classPctsForTopic.push((ts.score / ts.graded) * 100)
    }
    if (classPctsForTopic.length === 0) continue
    perTopic.push({
      topicId: t.id,
      title: t.title,
      studentPct: t.pct,
      classAvgPct: Math.round(classPctsForTopic.reduce((a, b) => a + b, 0) / classPctsForTopic.length),
      classSize: classPctsForTopic.length,
    })
  }

  return { classAvgOverallPct, classSize: overallPcts.length, perTopic }
}
