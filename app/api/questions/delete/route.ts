import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: removes a question. If students have already submitted work
// on it, a hard delete would cascade-wipe that submission/feedback/grade
// history (questions.id is referenced with `on delete cascade` from
// submissions, comments, board, answer_key_releases, ai_chat, assignments,
// student_assignments, grade_history), so this soft-deletes instead
// (is_active = false) whenever any submission exists — same tradeoff
// already used for diagnostic_questions. A question with zero submissions
// is hard-deleted since there's nothing to lose.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { questionId } = await req.json() as { questionId?: string }
  if (!questionId) {
    return NextResponse.json({ error: 'questionId is required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { count } = await admin
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', questionId)

  if (count && count > 0) {
    const { error } = await admin.from('questions').update({ is_active: false }).eq('id', questionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, softDeleted: true })
  }

  const { error } = await admin.from('questions').delete().eq('id', questionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, softDeleted: false })
}
