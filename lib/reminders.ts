import { createAdminClient } from './supabase/server'

export interface SubtopicReminder {
  topicTitle: string
  unitTitle: string
  remaining: number
}

export interface StudentDigest {
  studentId: string
  studentName: string
  email: string | null
  subtopics: SubtopicReminder[]
  dueSoon: { questionTitle: string; dueDate: string }[]
}

// Builds each enrolled student's reminder digest for a class: which
// subtopics still have unanswered assigned questions (grouped, not one
// email per question), and which assigned questions are due within the
// next `dueSoonDays` (including already-overdue). A student with nothing
// pending gets an empty digest — callers should skip sending for those.
export async function buildClassDigests(classId: string, dueSoonDays = 3): Promise<StudentDigest[]> {
  const admin = await createAdminClient()

  const [{ data: enrollments }, { data: units }] = await Promise.all([
    admin.from('class_enrollments').select('student_id').eq('class_id', classId),
    admin.from('units').select('id, title, order_index').eq('class_id', classId).order('order_index'),
  ])

  const studentIds = (enrollments ?? []).map(e => e.student_id)
  if (studentIds.length === 0) return []

  const { data: students } = await admin
    .from('profiles').select('id, full_name, email')
    .in('id', studentIds).eq('role', 'student').eq('approved', true)

  const unitIds = (units ?? []).map(u => u.id)
  const { data: topics } = unitIds.length > 0
    ? await admin.from('topics').select('id, title, unit_id').in('unit_id', unitIds)
    : { data: [] as { id: string; title: string; unit_id: string }[] }

  const topicIds = (topics ?? []).map(t => t.id)
  const { data: questions } = topicIds.length > 0
    ? await admin.from('questions').select('id, title, topic_id').in('topic_id', topicIds)
    : { data: [] as { id: string; title: string; topic_id: string }[] }

  const questionIds = (questions ?? []).map(q => q.id)
  const { data: assignments } = questionIds.length > 0
    ? await admin.from('assignments').select('question_id, due_date').eq('class_id', classId)
    : { data: [] as { question_id: string; due_date: string | null }[] }

  const assignedQuestionIds = new Set((assignments ?? []).map(a => a.question_id))
  const dueDateByQuestion = new Map((assignments ?? []).map(a => [a.question_id, a.due_date]))

  const { data: submissions } = questionIds.length > 0
    ? await admin.from('submissions').select('question_id, student_id').in('student_id', studentIds).in('question_id', questionIds)
    : { data: [] as { question_id: string; student_id: string }[] }

  const submittedSet = new Set((submissions ?? []).map(s => `${s.student_id}:${s.question_id}`))

  const unitTitleById = new Map((units ?? []).map(u => [u.id, u.title]))
  const topicById = new Map((topics ?? []).map(t => [t.id, t]))
  const assignedQuestions = (questions ?? []).filter(q => assignedQuestionIds.has(q.id))

  const dueSoonCutoff = new Date()
  dueSoonCutoff.setDate(dueSoonCutoff.getDate() + dueSoonDays)

  return (students ?? []).map(student => {
    // Group unanswered assigned questions by topic (subtopic) — this is
    // the whole point: one line per subtopic, not one per question.
    const remainingByTopic = new Map<string, number>()
    const dueSoon: StudentDigest['dueSoon'] = []

    for (const q of assignedQuestions) {
      const answered = submittedSet.has(`${student.id}:${q.id}`)
      if (!answered) {
        remainingByTopic.set(q.topic_id, (remainingByTopic.get(q.topic_id) ?? 0) + 1)
      }
      const dueDate = dueDateByQuestion.get(q.id)
      if (dueDate && !answered && new Date(dueDate) <= dueSoonCutoff) {
        dueSoon.push({ questionTitle: q.title, dueDate })
      }
    }

    const subtopics: SubtopicReminder[] = [...remainingByTopic.entries()]
      .map(([topicId, remaining]) => {
        const topic = topicById.get(topicId)
        return {
          topicTitle: topic?.title ?? 'Unknown topic',
          unitTitle: topic ? (unitTitleById.get(topic.unit_id) ?? '') : '',
          remaining,
        }
      })
      .sort((a, b) => b.remaining - a.remaining)

    return {
      studentId: student.id,
      studentName: student.full_name,
      email: student.email ?? null,
      subtopics,
      dueSoon: dueSoon.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    }
  })
}
