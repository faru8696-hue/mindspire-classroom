import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: discards a pending email review without sending it — e.g.
// the teacher spots something they want to change and would rather redo
// the send from scratch than confirm this one.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { token } = await req.json() as { token?: string }
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: pending } = await admin
    .from('diagnostic_pending_emails')
    .select('id, status')
    .eq('token', token)
    .maybeSingle()
  if (!pending) return NextResponse.json({ error: 'This review link is invalid.' }, { status: 404 })
  if (pending.status !== 'pending') return NextResponse.json({ error: 'This email is no longer pending.' }, { status: 400 })

  const { error } = await admin.from('diagnostic_pending_emails').update({ status: 'cancelled' }).eq('id', pending.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
