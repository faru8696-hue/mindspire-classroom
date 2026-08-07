import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Returns a student's saved whiteboard for a question via service role.
// The submissions table has no working SELECT policy under RLS, so the teacher
// live board can't read it (or get realtime postgres_changes) as the client —
// it polls this instead. A teacher may read any student's work; a student may
// only read their own.
export async function GET(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const questionId = req.nextUrl.searchParams.get('questionId')
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!questionId || !studentId) {
    return NextResponse.json({ error: 'Missing questionId or studentId' }, { status: 400 })
  }

  if (caller.profile?.role !== 'teacher' && caller.user.id !== studentId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Cheap change-detection mode for TeacherWatchBoard's poll — just the
  // timestamp, no canvas_data. The old version returned the student's full
  // board (and a second query for the teacher's own annotation layer) on
  // every single poll tick regardless of whether anything had changed; at a
  // 4s interval with a page left open for a class period, that was a real
  // source of wasted egress — the same shape of bug already fixed for the
  // live grid's /api/feedback-canvas poll.
  if (req.nextUrl.searchParams.get('versionOnly') === '1') {
    const { data: versionRow } = await admin
      .from('submissions')
      .select('updated_at')
      .eq('question_id', questionId)
      .eq('student_id', studentId)
      .maybeSingle()
    return NextResponse.json({ updatedAt: versionRow?.updated_at ?? null })
  }

  const { data, error } = await admin
    .from('submissions')
    .select('id, canvas_data, updated_at')
    .eq('question_id', questionId)
    .eq('student_id', studentId)
    .maybeSingle()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also return the teacher's annotation layer (feedback.canvas_data) so the
  // student board can reconcile it from the DB — this self-heals any live
  // broadcast that was dropped or arrived out of order.
  let feedbackCanvas: string | null = null
  let grade: string | null = null
  let textFeedback: string | null = null
  if (data?.id) {
    const { data: fb } = await admin
      .from('feedback')
      .select('canvas_data, grade, text_feedback')
      .eq('submission_id', data.id)
      .maybeSingle()
    feedbackCanvas = fb?.canvas_data ?? null
    grade = fb?.grade ?? null
    textFeedback = fb?.text_feedback ?? null
  }

  return NextResponse.json({
    submissionId: data?.id ?? null,
    canvasData: data?.canvas_data ?? null,
    feedbackCanvas,
    grade,
    textFeedback,
    updatedAt: data?.updated_at ?? null,
  })
}
