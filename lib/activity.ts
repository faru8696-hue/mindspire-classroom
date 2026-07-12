import { createAdminClient } from './supabase/server'

// Unified "what has this student (or everyone) been doing" feed — merges
// three separate tables that each capture one kind of event (help/done/
// comment pings, grading events, AI Faridah usage) into one normalized,
// chronologically sorted list. Raw whiteboard autosaves are deliberately
// excluded — they fire on every stroke and would drown out anything
// actually meaningful.
export interface ActivityEvent {
  id: string
  type: 'help' | 'submitted' | 'comment' | 'assignment' | 'graded' | 'ai_chat'
  studentId: string
  studentName: string
  questionId: string | null
  questionTitle: string | null
  message: string | null
  grade: string | null
  createdAt: string
}

export async function getRecentActivity({ studentId, limit = 200 }: { studentId?: string; limit?: number } = {}): Promise<ActivityEvent[]> {
  const admin = await createAdminClient()

  let notifQuery = admin.from('notifications')
    .select('id, type, student_id, question_id, message, created_at')
    .order('created_at', { ascending: false }).limit(limit)
  let gradeQuery = admin.from('grade_history')
    .select('id, student_id, question_id, grade, text_feedback, created_at')
    .order('created_at', { ascending: false }).limit(limit)
  let chatQuery = admin.from('ai_chat_messages')
    .select('id, student_id, question_id, message, created_at')
    .eq('role', 'user')
    .order('created_at', { ascending: false }).limit(limit)

  if (studentId) {
    notifQuery = notifQuery.eq('student_id', studentId)
    gradeQuery = gradeQuery.eq('student_id', studentId)
    chatQuery = chatQuery.eq('student_id', studentId)
  }

  const [{ data: notifs }, { data: grades }, { data: chats }] = await Promise.all([notifQuery, gradeQuery, chatQuery])

  type NotifRow = { id: string; type: string; student_id: string; question_id: string | null; message: string | null; created_at: string }
  type GradeRow = { id: string; student_id: string; question_id: string; grade: string; text_feedback: string | null; created_at: string }
  type ChatRow = { id: string; student_id: string; question_id: string; message: string; created_at: string }

  const allStudentIds = new Set<string>()
  const allQuestionIds = new Set<string>()
  for (const n of (notifs ?? []) as NotifRow[]) { allStudentIds.add(n.student_id); if (n.question_id) allQuestionIds.add(n.question_id) }
  for (const g of (grades ?? []) as GradeRow[]) { allStudentIds.add(g.student_id); allQuestionIds.add(g.question_id) }
  for (const c of (chats ?? []) as ChatRow[]) { allStudentIds.add(c.student_id); allQuestionIds.add(c.question_id) }

  const [{ data: profiles }, { data: questions }] = await Promise.all([
    allStudentIds.size > 0 ? admin.from('profiles').select('id, full_name').in('id', [...allStudentIds]) : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    allQuestionIds.size > 0 ? admin.from('questions').select('id, title').in('id', [...allQuestionIds]) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])
  const nameById = new Map((profiles ?? []).map(p => [p.id, p.full_name]))
  const titleById = new Map((questions ?? []).map(q => [q.id, q.title]))

  const events: ActivityEvent[] = [
    ...((notifs ?? []) as NotifRow[]).map(n => ({
      id: `notif:${n.id}`,
      type: (n.type === 'help' || n.type === 'submitted' || n.type === 'comment' || n.type === 'assignment' ? n.type : 'comment') as ActivityEvent['type'],
      studentId: n.student_id,
      studentName: nameById.get(n.student_id) ?? 'Unknown',
      questionId: n.question_id,
      questionTitle: n.question_id ? (titleById.get(n.question_id) ?? null) : null,
      message: n.message,
      grade: null,
      createdAt: n.created_at,
    })),
    ...((grades ?? []) as GradeRow[]).map(g => ({
      id: `grade:${g.id}`,
      type: 'graded' as const,
      studentId: g.student_id,
      studentName: nameById.get(g.student_id) ?? 'Unknown',
      questionId: g.question_id,
      questionTitle: titleById.get(g.question_id) ?? null,
      message: g.text_feedback,
      grade: g.grade,
      createdAt: g.created_at,
    })),
    ...((chats ?? []) as ChatRow[]).map(c => ({
      id: `chat:${c.id}`,
      type: 'ai_chat' as const,
      studentId: c.student_id,
      studentName: nameById.get(c.student_id) ?? 'Unknown',
      questionId: c.question_id,
      questionTitle: titleById.get(c.question_id) ?? null,
      message: c.message,
      grade: null,
      createdAt: c.created_at,
    })),
  ]

  return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
}
