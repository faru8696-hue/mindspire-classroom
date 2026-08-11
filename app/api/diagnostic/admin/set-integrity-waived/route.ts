import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: waives (or restores) the automatic tab-switch integrity
// deduction for one attempt — e.g. the time away was clearly innocent and
// the teacher doesn't want it counting against the score shown to the
// student/parent. See lib/diagnosticResult.ts, which zeroes out the
// effective deduction whenever this is true.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { attemptId, waived } = await req.json() as { attemptId?: string; waived?: boolean }
  if (!attemptId || typeof waived !== 'boolean') {
    return NextResponse.json({ error: 'attemptId and waived are required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('diagnostic_attempts')
    .update({ integrity_deduction_waived: waived })
    .eq('id', attemptId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
