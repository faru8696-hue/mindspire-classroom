import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Resets a student's work on a question back to blank — used when a teacher
// wants a student to redo something from scratch (individually, or the whole
// class at once by passing every enrolled student's id). Wipes the
// submission's canvas/text AND any grade/feedback already given, but leaves
// grade_history alone — that's the permanent record and clearing a board
// isn't the same as erasing that a grade was once given.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { questionId, studentIds } = await req.json()
  if (!questionId || !Array.isArray(studentIds) || studentIds.length === 0) {
    return NextResponse.json({ error: 'Missing questionId or studentIds' }, { status: 400 })
  }

  const { data: existing, error: findErr } = await admin
    .from('submissions')
    .select('id')
    .eq('question_id', questionId)
    .in('student_id', studentIds)
  if (findErr) {
    console.error('clear-work: lookup error:', findErr)
    return NextResponse.json({ error: findErr.message }, { status: 500 })
  }

  const submissionIds = (existing ?? []).map(s => s.id)
  if (submissionIds.length === 0) {
    return NextResponse.json({ ok: true, cleared: 0 })
  }

  const [{ error: subErr }, { error: fbErr }] = await Promise.all([
    admin.from('submissions')
      .update({ canvas_data: '[]', text_answer: null, updated_at: new Date().toISOString() })
      .in('id', submissionIds),
    admin.from('feedback').delete().in('submission_id', submissionIds),
  ])
  if (subErr) {
    console.error('clear-work: submission reset error:', subErr)
    return NextResponse.json({ error: subErr.message }, { status: 500 })
  }
  if (fbErr) {
    console.error('clear-work: feedback delete error:', fbErr)
    return NextResponse.json({ error: fbErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, cleared: submissionIds.length })
}
