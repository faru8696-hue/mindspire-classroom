import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { testId, title, description, durationMinutes, allowOvertime, instantResults } = await req.json() as {
    testId?: string
    title?: string
    description?: string
    durationMinutes?: number
    allowOvertime?: boolean
    instantResults?: boolean
  }
  if (!testId || !title) {
    return NextResponse.json({ error: 'testId and title are required.' }, { status: 400 })
  }
  if (durationMinutes !== undefined && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) {
    return NextResponse.json({ error: 'durationMinutes must be a positive number.' }, { status: 400 })
  }

  // Deliberately does not accept a slug change here — the slug is the public
  // URL a teacher may have already shared; renaming the test shouldn't break it.
  const admin = await createAdminClient()
  const corePatch: Record<string, unknown> = { title, description: description || null }
  if (durationMinutes !== undefined) corePatch.duration_minutes = durationMinutes
  const { error } = await admin
    .from('diagnostic_tests')
    .update(corePatch)
    .eq('id', testId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Separate, best-effort — allow_overtime only exists once
  // add-diagnostic-overtime.sql has been run; the core title/description/
  // duration update above must never depend on that (same reasoning as the
  // integrity-deduction fields in submit-attempt).
  if (allowOvertime !== undefined) {
    const { error: overtimeError } = await admin
      .from('diagnostic_tests')
      .update({ allow_overtime: allowOvertime })
      .eq('id', testId)
    if (overtimeError) console.error('update-test allow_overtime error (migration likely not run yet):', overtimeError)
  }

  // Same defensive pattern, for add-diagnostic-instant-results.sql.
  if (instantResults !== undefined) {
    const { error: instantError } = await admin
      .from('diagnostic_tests')
      .update({ instant_results: instantResults })
      .eq('id', testId)
    if (instantError) console.error('update-test instant_results error (migration likely not run yet):', instantError)
  }

  return NextResponse.json({ ok: true })
}
