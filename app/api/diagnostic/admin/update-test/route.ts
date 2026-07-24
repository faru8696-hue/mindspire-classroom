import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { testId, title, description } = await req.json() as { testId?: string; title?: string; description?: string }
  if (!testId || !title) {
    return NextResponse.json({ error: 'testId and title are required.' }, { status: 400 })
  }

  // Deliberately does not accept a slug change here — the slug is the public
  // URL a teacher may have already shared; renaming the test shouldn't break it.
  const admin = await createAdminClient()
  const { error } = await admin
    .from('diagnostic_tests')
    .update({ title, description: description || null })
    .eq('id', testId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
