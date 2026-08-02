import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: saves a flattened annotation image (student's original work
// + the teacher's drawn-on-top marks, baked into one PNG by ScratchBoard's
// getSnapshot()) for one FRQ answer. Never touches canvas_data — the
// student's original submission stays intact regardless of how many times
// this gets re-annotated.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { attemptId, questionId, annotationDataUrl } = await req.json() as {
    attemptId?: string; questionId?: string; annotationDataUrl?: string | null
  }
  if (!attemptId || !questionId) {
    return NextResponse.json({ error: 'attemptId and questionId are required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('diagnostic_attempt_answers')
    .update({ teacher_annotation: annotationDataUrl ?? null })
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
