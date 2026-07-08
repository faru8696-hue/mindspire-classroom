import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { classId, studentIds, questionId, questionTitle } = await req.json()

  // Resolve student list — either explicit list or all enrolled in class
  let targets: string[] = studentIds ?? []
  if (!targets.length && classId) {
    const { data } = await admin
      .from('class_enrollments')
      .select('student_id')
      .eq('class_id', classId)
    targets = data?.map((r: { student_id: string }) => r.student_id) ?? []
  }

  if (!targets.length || !questionId) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Batch: if a teacher assigns several questions in a row (e.g. rolling out
  // a whole unit), each student would otherwise get one full notification per
  // question — a class of enrolled students times a dozen new questions
  // becomes 100+ near-identical "new question assigned" pings within
  // minutes. Instead, roll any assignment notification from the last 2 hours
  // that's still unread into a single "N new questions assigned" entry per
  // student, bumping the count and pointing at the most recently assigned
  // question.
  const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  let notified = 0
  for (const student_id of targets) {
    const { data: existing } = await admin
      .from('student_notifications')
      .select('id, count')
      .eq('student_id', student_id)
      .eq('type', 'assignment')
      .eq('read', false)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      const nextCount = (existing.count ?? 1) + 1
      await admin.from('student_notifications').update({
        question_id: questionId,
        feedback: `${nextCount} new questions assigned`,
        count: nextCount,
        created_at: now,
      }).eq('id', existing.id)
    } else {
      await admin.from('student_notifications').insert({
        student_id, question_id: questionId, type: 'assignment',
        feedback: null, grade: null, read: false, count: 1,
      })
    }
    notified++
  }

  return NextResponse.json({ ok: true, notified })
}
