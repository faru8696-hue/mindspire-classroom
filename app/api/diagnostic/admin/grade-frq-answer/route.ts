import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: sets (or clears) the points earned on one FRQ answer within
// a completed attempt. Read live by getDiagnosticResult rather than frozen
// like the MCQ score — grading happens progressively any time after the
// student finishes, not at submit time.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { attemptId, questionId, pointsEarned } = await req.json() as {
    attemptId?: string; questionId?: string; pointsEarned?: number | null
  }
  if (!attemptId || !questionId) {
    return NextResponse.json({ error: 'attemptId and questionId are required.' }, { status: 400 })
  }
  if (pointsEarned !== null && pointsEarned !== undefined && (typeof pointsEarned !== 'number' || Number.isNaN(pointsEarned) || pointsEarned < 0)) {
    return NextResponse.json({ error: 'pointsEarned must be a non-negative number.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Clamp to the question's max points server-side too, not just in the UI.
  const { data: question } = await admin.from('diagnostic_questions').select('points').eq('id', questionId).maybeSingle()
  if (typeof pointsEarned === 'number' && question?.points != null && pointsEarned > question.points) {
    return NextResponse.json({ error: `pointsEarned cannot exceed ${question.points}.` }, { status: 400 })
  }

  const { error } = await admin
    .from('diagnostic_attempt_answers')
    .update({ points_earned: pointsEarned ?? null })
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
