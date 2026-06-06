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

  const { studentId, questionId, grade, textFeedback, canvasData, notify } = await req.json()
  if (!studentId || !questionId) {
    return NextResponse.json({ error: 'Missing studentId or questionId' }, { status: 400 })
  }

  // Feedback is keyed by submission. A teacher may grade before the student has
  // saved anything, so resolve the submission and create an empty one if needed.
  let submissionId: string | null = null
  const { data: existing } = await admin
    .from('submissions')
    .select('id')
    .eq('question_id', questionId)
    .eq('student_id', studentId)
    .maybeSingle()

  // The grade as it stood before this call — used to detect a real grade change
  // so we only append a history row when the grade actually moves.
  let previousGrade: string | null = null
  if (existing?.id) {
    const { data: prevFb } = await admin
      .from('feedback')
      .select('grade')
      .eq('submission_id', existing.id)
      .maybeSingle()
    previousGrade = prevFb?.grade ?? null
  }

  if (existing?.id) {
    submissionId = existing.id
  } else {
    const { data: created, error: subErr } = await admin
      .from('submissions')
      .insert({ question_id: questionId, student_id: studentId, canvas_data: '[]' })
      .select('id')
      .single()
    if (subErr) {
      console.error('grade: submission create error:', subErr)
      return NextResponse.json({ error: subErr.message }, { status: 500 })
    }
    submissionId = created.id
  }

  // teacher_id is NOT NULL on the feedback table — set it to the grading teacher.
  const patch: Record<string, unknown> = { submission_id: submissionId, teacher_id: caller.user.id }
  if (grade !== undefined) patch.grade = grade
  if (textFeedback !== undefined) patch.text_feedback = textFeedback
  if (canvasData !== undefined) patch.canvas_data = canvasData

  const { error } = await admin.from('feedback').upsert(patch, { onConflict: 'submission_id' })
  if (error) {
    console.error('grade upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Append to the grade history whenever a grade is applied and it actually
  // changed (including the first grade). This is what makes "improvement over
  // time" possible — the feedback row only ever holds the latest grade.
  if (grade && grade !== previousGrade) {
    const { error: histErr } = await admin.from('grade_history').insert({
      student_id: studentId,
      question_id: questionId,
      submission_id: submissionId,
      grade,
      text_feedback: textFeedback || null,
      teacher_id: caller.user.id,
    })
    // Don't fail grading if history logging fails (e.g. table not yet created).
    if (histErr) console.error('grade_history insert error:', histErr)
  }

  // Persist a student notification when an actual grade was applied
  if (notify && grade) {
    await admin.from('student_notifications').insert({
      student_id: studentId,
      question_id: questionId,
      grade,
      feedback: textFeedback || null,
      type: 'grade',
      read: false,
    })
  }

  return NextResponse.json({ ok: true, submissionId })
}
