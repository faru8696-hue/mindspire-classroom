import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
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

  const rows = targets.map(student_id => ({
    student_id,
    question_id: questionId,
    type: 'assignment',
    feedback: questionTitle ?? null,
    grade: null,
    read: false,
  }))

  const { error } = await admin.from('student_notifications').insert(rows)
  if (error) {
    console.error('notify-assignment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, notified: targets.length })
}
