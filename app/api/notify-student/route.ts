import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { studentId, questionId, grade, feedback, type } = await req.json()
  if (!studentId || !questionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin
    .from('student_notifications')
    .insert({ student_id: studentId, question_id: questionId, grade: grade || null, feedback: feedback || null, type: type || 'grade', read: false })
    .select()

  if (error) {
    console.error('notify-student error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data })
}
