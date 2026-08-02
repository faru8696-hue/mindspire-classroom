import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: sets (or clears) the grade on one FRQ answer within a
// completed attempt. Read live by getDiagnosticResult rather than frozen
// like the MCQ score — grading happens progressively any time after the
// student finishes, not at submit time.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { attemptId, questionId, grade } = await req.json() as {
    attemptId?: string; questionId?: string; grade?: 'correct' | 'partial' | 'incorrect' | null
  }
  if (!attemptId || !questionId) {
    return NextResponse.json({ error: 'attemptId and questionId are required.' }, { status: 400 })
  }
  if (grade !== null && grade !== undefined && !['correct', 'partial', 'incorrect'].includes(grade)) {
    return NextResponse.json({ error: 'Invalid grade.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('diagnostic_attempt_answers')
    .update({ grade: grade ?? null })
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
