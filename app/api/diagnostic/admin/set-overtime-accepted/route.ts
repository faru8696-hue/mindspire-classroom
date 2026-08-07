import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// The explicit teacher decision behind a late (overtime) submission —
// separate from results_released (visibility): this is about whether the
// score is even VALID, release is about whether the student/parent can see
// it yet. release-results and email-result both refuse to release a
// submitted_late attempt until this is true (see lib/diagnosticResult.ts).
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { attemptId, accepted } = await req.json() as { attemptId?: string; accepted?: boolean }
  if (!attemptId || typeof accepted !== 'boolean') {
    return NextResponse.json({ error: 'attemptId and accepted are required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('diagnostic_attempts')
    .update({ overtime_accepted: accepted })
    .eq('id', attemptId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
