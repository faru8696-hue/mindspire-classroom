import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Toggles whether the STUDENT-facing results page shows the score/breakdown
// for one attempt, or a "your teacher will share results soon" holding
// message — see lib/diagnosticResult.ts and
// app/diagnostic/[slug]/results/[attemptId]/page.tsx. Never gates the
// teacher's own attempt view, which always shows full results.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { attemptId, released } = await req.json() as { attemptId?: string; released?: boolean }
  if (!attemptId || typeof released !== 'boolean') {
    return NextResponse.json({ error: 'attemptId and released are required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('diagnostic_attempts')
    .update({ results_released: released })
    .eq('id', attemptId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
