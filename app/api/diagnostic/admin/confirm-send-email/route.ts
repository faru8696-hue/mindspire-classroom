import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { sendDiagnosticResultEmail } from '@/lib/sendDiagnosticResultEmail'

// Teacher-only: the actual send, triggered by the "Confirm & Send" button on
// app/teacher/diagnostics/confirm-email/[token] (reached from the preview
// email — see email-result/route.ts). Rebuilds the email from the pending
// row's saved settings rather than trusting anything from the client, so
// what gets sent always matches what was reviewed.
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
    .select('id, attempt_id, teacher_note, include_mcq, include_frq, include_integrity_note, status')
    .eq('token', token)
    .maybeSingle()
  if (!pending) return NextResponse.json({ error: 'This review link is invalid.' }, { status: 404 })
  if (pending.status === 'sent') return NextResponse.json({ error: 'This email has already been sent.' }, { status: 400 })
  if (pending.status === 'cancelled') return NextResponse.json({ error: 'This email was cancelled.' }, { status: 400 })

  const outcome = await sendDiagnosticResultEmail(admin, {
    attemptId: pending.attempt_id as string,
    teacherNote: pending.teacher_note as string | null,
    includeMcq: pending.include_mcq as boolean,
    includeFrq: pending.include_frq as boolean,
    includeIntegrityNote: pending.include_integrity_note as boolean,
  })
  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status })

  await admin.from('diagnostic_pending_emails').update({ status: 'sent', confirmed_at: new Date().toISOString() }).eq('id', pending.id)

  return NextResponse.json({ ok: true, sentTo: outcome.sentTo, errors: outcome.errors })
}
