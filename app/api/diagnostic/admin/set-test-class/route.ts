import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { testId, classId } = await req.json() as { testId?: string; classId?: string | null }
  if (!testId) {
    return NextResponse.json({ error: 'testId is required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('diagnostic_tests')
    .update({ class_id: classId || null })
    .eq('id', testId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
