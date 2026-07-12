import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: saves a manually edited/corrected answer key. This is how a
// teacher fixes an AI-generated draft that's wrong — always the last word.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { questionId, answerKey } = await req.json()
  if (!questionId) {
    return NextResponse.json({ error: 'Missing questionId' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('questions').update({ answer_key: answerKey || null }).eq('id', questionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
