import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { leadId } = await req.json() as { leadId?: string }
  if (!leadId) {
    return NextResponse.json({ error: 'leadId is required.' }, { status: 400 })
  }

  // diagnostic_leads is one row per attempt (a retake creates a fresh lead
  // rather than reusing one), so deleting the lead row cascades through
  // diagnostic_attempts to diagnostic_attempt_answers and fully removes this
  // student's entry — contact info, attempt, and graded answers — in one go.
  const admin = await createAdminClient()
  const { error } = await admin.from('diagnostic_leads').delete().eq('id', leadId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
