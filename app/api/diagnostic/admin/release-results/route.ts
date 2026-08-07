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

  // A late (overtime) submission can't be released until the teacher has
  // explicitly accepted it (see OvertimeReviewPanel) — fetched separately,
  // defaulting to "not late" on error since add-diagnostic-overtime.sql may
  // not have been run yet, same defensive pattern used throughout this
  // feature. Only blocks turning release ON; hiding is always allowed.
  if (released) {
    const { data: overtimeRow } = await admin
      .from('diagnostic_attempts')
      .select('submitted_late, overtime_accepted')
      .eq('id', attemptId)
      .maybeSingle()
    if (overtimeRow?.submitted_late && overtimeRow.overtime_accepted !== true) {
      return NextResponse.json({ error: 'This attempt was submitted after the time limit — accept or reject the overtime score first.' }, { status: 400 })
    }
  }

  const { error } = await admin
    .from('diagnostic_attempts')
    .update({ results_released: released })
    .eq('id', attemptId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
