import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

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

  // A hard delete cascades to diagnostic_attempt_answers, silently corrupting
  // any past student's recorded results for this question. If it's already been
  // answered at least once, deactivate it instead (excluded from future draws,
  // same as the existing is_active filter in start-attempt) rather than deleting.
  const { count } = await admin
    .from('diagnostic_attempt_answers')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', questionId)

  if (count && count > 0) {
    const { error } = await admin.from('diagnostic_questions').update({ is_active: false }).eq('id', questionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, softDeleted: true })
  }

  const { error } = await admin.from('diagnostic_questions').delete().eq('id', questionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, softDeleted: false })
}
