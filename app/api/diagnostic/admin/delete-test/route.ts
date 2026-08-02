import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: permanently deletes an entire test — every topic, question,
// lead, attempt, and attempt-answer under it. diagnostic_topics,
// diagnostic_questions, diagnostic_leads, and diagnostic_attempts all
// reference diagnostic_tests(id) on delete cascade, so removing the test row
// itself is enough to clean up everything beneath it in one go.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { testId } = await req.json() as { testId?: string }
  if (!testId) {
    return NextResponse.json({ error: 'testId is required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('diagnostic_tests').delete().eq('id', testId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
