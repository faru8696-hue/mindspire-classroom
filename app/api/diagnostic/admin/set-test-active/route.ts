import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Inactive tests are hidden from their published class's student page and
// can't be started via the public /diagnostic/[slug] link (start-attempt
// checks is_active) — this is the "don't release it yet" switch, separate
// from which class a test is tagged to.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { testId, isActive } = await req.json() as { testId?: string; isActive?: boolean }
  if (!testId || typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'testId and isActive are required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('diagnostic_tests')
    .update({ is_active: isActive })
    .eq('id', testId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
