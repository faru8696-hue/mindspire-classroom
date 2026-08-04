import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { testId } = await req.json() as { testId?: string }
  if (!testId) {
    return NextResponse.json({ error: 'testId is required.' }, { status: 400 })
  }

  // practice_attempts.test_id and practice_test_notifications.test_id both
  // reference practice_tests(id) on delete cascade, so deleting the test row
  // alone removes the student's answers/self-grades and any related
  // notification in one go.
  const admin = await createAdminClient()
  const { error } = await admin.from('practice_tests').delete().eq('id', testId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
