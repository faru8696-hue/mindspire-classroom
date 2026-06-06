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

  const { submissionId, grade, textFeedback, canvasData, studentId, questionId, notify } = await req.json()
  if (!submissionId) {
    return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { submission_id: submissionId }
  if (grade !== undefined) patch.grade = grade
  if (textFeedback !== undefined) patch.text_feedback = textFeedback
  if (canvasData !== undefined) patch.canvas_data = canvasData

  const { error } = await admin.from('feedback').upsert(patch, { onConflict: 'submission_id' })
  if (error) {
    console.error('grade upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Persist a student notification when an actual grade was applied
  if (notify && grade && studentId && questionId) {
    await admin.from('student_notifications').insert({
      student_id: studentId,
      question_id: questionId,
      grade,
      feedback: textFeedback || null,
      type: 'grade',
      read: false,
    })
  }

  return NextResponse.json({ ok: true })
}
