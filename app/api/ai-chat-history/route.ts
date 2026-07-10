import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: read a student's full AI Faridah chat transcript for a
// question, so the teacher can see what the student asked and how the AI
// guided them — this table is RLS-gated to the student's own rows, so a
// teacher's client can't read it directly.
export async function GET(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const questionId = req.nextUrl.searchParams.get('questionId')
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!questionId || !studentId) {
    return NextResponse.json({ error: 'Missing questionId or studentId' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('ai_chat_messages')
    .select('role, message, created_at')
    .eq('question_id', questionId)
    .eq('student_id', studentId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data ?? [] })
}
