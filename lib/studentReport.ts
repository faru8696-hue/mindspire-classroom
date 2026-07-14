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

  const { data: submissions } = questionIds.length > 0
    ? await supabase.from('submissions').select('id, question_id, canvas_data, text_answer, updated_at').eq('student_id', studentId).in('question_id', questionIds)
    : { data: [] }
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
  }
}
