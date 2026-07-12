import { createAdminClient } from './supabase/server'

// Unified "what has this student (or everyone) been doing" feed — merges
// two tables that each capture one kind of event (help/done/comment pings,
// AI Faridah usage) into one normalized, chronologically sorted list. Raw
// whiteboard autosaves are deliberately excluded — they fire on every
// stroke and would drown out anything actually meaningful. Grading isn't
// its own event either — a "done" ping shows the CURRENT grade (or
// "Ungraded") next to it instead of a separate "was graded" line, since the
// grade can change and a stale grading event would be misleading.
export interface ActivityEvent {
  id: string
  type: 'help' | 'submitted' | 'comment' | 'assignment' | 'ai_chat'
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
  let chatQuery = admin.from('ai_chat_messages')
    .select('id, student_id, question_id, message, created_at')
    .eq('role', 'user')
    .order('created_at', { ascending: false }).limit(limit)

  if (studentId) {
    notifQuery = notifQuery.eq('student_id', studentId)
    chatQuery = chatQuery.eq('student_id', studentId)
  }

  const [{ data: notifs }, { data: chats }] = await Promise.all([notifQuery, chatQuery])

  type NotifRow = { id: string; type: string; student_id: string; question_id: string | null; message: string | null; created_at: string }
  type ChatRow = { id: string; student_id: string; question_id: string; message: string; created_at: string }

  const allStudentIds = new Set<string>()
  const allQuestionIds = new Set<string>()
  for (const n of (notifs ?? []) as NotifRow[]) { allStudentIds.add(n.student_id); if (n.question_id) allQuestionIds.add(n.question_id) }
  for (const c of (chats ?? []) as ChatRow[]) { allStudentIds.add(c.student_id); allQuestionIds.add(c.question_id) }

  const [{ data: profiles }, { data: questions }] = await Promise.all([
    allStudentIds.size > 0 ? admin.from('profiles').select('id, full_name').in('id', [...allStudentIds]) : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    allQuestionIds.size > 0 ? admin.from('questions').select('id, title').in('id', [...allQuestionIds]) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])
  const nameById = new Map((profiles ?? []).map(p => [p.id, p.full_name]))
  const titleById = new Map((questions ?? []).map(q => [q.id, q.title]))

  // For every "done" ping, look up the CURRENT grade (feedback is
  // upserted per submission, so this is always the latest, unlike a
  // grade_history row which could be stale by the time it's read).
  const doneNotifs = ((notifs ?? []) as NotifRow[]).filter(n => n.type === 'submitted' && n.question_id)
  const gradeByStudentQuestion = new Map<string, string | null>()
  if (doneNotifs.length > 0) {
    const doneStudentIds = [...new Set(doneNotifs.map(n => n.student_id))]
    const doneQuestionIds = [...new Set(doneNotifs.map(n => n.question_id as string))]
    const { data: submissions } = await admin
      .from('submissions').select('id, student_id, question_id')
      .in('student_id', doneStudentIds).in('question_id', doneQuestionIds)
    const submissionIds = (submissions ?? []).map(s => s.id)
    const { data: feedbacks } = submissionIds.length > 0
      ? await admin.from('feedback').select('submission_id, grade').in('submission_id', submissionIds)
      : { data: [] as { submission_id: string; grade: string | null }[] }
    const gradeBySubmission = new Map((feedbacks ?? []).map(f => [f.submission_id, f.grade]))
    for (const s of submissions ?? []) {
      gradeByStudentQuestion.set(`${s.student_id}:${s.question_id}`, gradeBySubmission.get(s.id) ?? null)
    }
  }

  const events: ActivityEvent[] = [
    ...((notifs ?? []) as NotifRow[]).map(n => {
      const type = (n.type === 'help' || n.type === 'submitted' || n.type === 'comment' || n.type === 'assignment' ? n.type : 'comment') as ActivityEvent['type']
      return {
        id: `notif:${n.id}`,
        type,
        studentId: n.student_id,
        studentName: nameById.get(n.student_id) ?? 'Unknown',
        questionId: n.question_id,
        questionTitle: n.question_id ? (titleById.get(n.question_id) ?? null) : null,
        message: n.message,
        grade: type === 'submitted' && n.question_id ? (gradeByStudentQuestion.get(`${n.student_id}:${n.question_id}`) ?? 'ungraded') : null,
        createdAt: n.created_at,
      }
    }),
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
