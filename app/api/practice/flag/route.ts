import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Manual "flag for review" toggle — available from any question, not just
// self-study sessions, so a student can bookmark something they hit during
// normal assigned work too.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { questionId, flagged } = await req.json() as { questionId: string; flagged: boolean }
  if (!questionId || typeof flagged !== 'boolean') {
    return NextResponse.json({ error: 'Missing questionId or flagged' }, { status: 400 })
  }

  const admin = await createAdminClient()

  if (flagged) {
    const { error } = await admin.from('review_flags')
      .upsert({ student_id: caller.user.id, question_id: questionId, source: 'manual' }, { onConflict: 'student_id,question_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin.from('review_flags')
      .delete()
      .eq('student_id', caller.user.id)
      .eq('question_id', questionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
