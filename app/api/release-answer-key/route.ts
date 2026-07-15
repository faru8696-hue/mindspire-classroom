import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only toggle: grants (or revokes) one specific student's access to
// one specific question's answer key. Deliberately per-student, not
// per-class — releasing it to one student who's been stuck shouldn't hand
// the whole class the answer.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId, questionId, released } = await req.json() as { studentId: string; questionId: string; released: boolean }
  if (!studentId || !questionId || typeof released !== 'boolean') {
    return NextResponse.json({ error: 'Missing studentId, questionId, or released' }, { status: 400 })
  }

  const admin = await createAdminClient()

  if (released) {
    const { error } = await admin.from('answer_key_releases')
      .upsert({ teacher_id: caller.user.id, student_id: studentId, question_id: questionId }, { onConflict: 'student_id,question_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin.from('answer_key_releases')
      .delete()
      .eq('student_id', studentId)
      .eq('question_id', questionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
