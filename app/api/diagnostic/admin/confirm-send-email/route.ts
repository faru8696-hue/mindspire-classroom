import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { getDiagnosticResult } from '@/lib/diagnosticResult'
import { resultEmailHtml } from '@/lib/diagnosticEmailTemplate'
import { sendEmail } from '@/lib/email'

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

  const attemptId = pending.attempt_id as string
  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, lead_id, diagnostic_test_id')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 })

  const { data: lead } = await admin
    .from('diagnostic_leads')
    .select('student_name, student_email, parent_name, parent_email')
    .eq('id', attempt.lead_id)
    .maybeSingle()
  if (!lead) return NextResponse.json({ error: 'No contact info found for this attempt.' }, { status: 404 })

  const lookup = await getDiagnosticResult(attemptId)
  if (lookup.status !== 'completed') return NextResponse.json({ error: 'This attempt is not completed yet.' }, { status: 400 })

  // Re-check — the overtime decision could have changed (or been reverted)
  // in the time between the preview being sent and this confirmation.
  if (lookup.result.submittedLate && lookup.result.overtimeAccepted !== true) {
    return NextResponse.json({ error: 'This attempt was submitted after the time limit — accept or reject the overtime score first.' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://classroom.mindspirelab.com'
  const { data: test } = await admin.from('diagnostic_tests').select('slug').eq('id', attempt.diagnostic_test_id).maybeSingle()
  const resultsUrl = `${baseUrl}/diagnostic/${test?.slug ?? ''}/results/${attemptId}`

  const subject = `${lookup.result.testTitle} results — ${lookup.result.studentName}`
  const note = pending.teacher_note as string | null
  const includeMcq = pending.include_mcq as boolean
  const includeFrq = pending.include_frq as boolean
  const includeIntegrityNote = pending.include_integrity_note as boolean

  const sentTo: string[] = []
  const errors: string[] = []

  try {
    await sendEmail({ to: lead.student_email, subject, html: resultEmailHtml(lookup.result, lead.student_name, resultsUrl, note, includeMcq, includeFrq, includeIntegrityNote) })
    sentTo.push(lead.student_email)
  } catch (e) {
    errors.push(`student (${lead.student_email}): ${e instanceof Error ? e.message : 'failed'}`)
  }

  try {
    await sendEmail({ to: lead.parent_email, subject, html: resultEmailHtml(lookup.result, lead.parent_name, resultsUrl, note, includeMcq, includeFrq, includeIntegrityNote) })
    sentTo.push(lead.parent_email)
  } catch (e) {
    errors.push(`parent (${lead.parent_email}): ${e instanceof Error ? e.message : 'failed'}`)
  }

  if (sentTo.length === 0) {
    return NextResponse.json({ error: `Could not send either email. ${errors.join('; ')}` }, { status: 500 })
  }

  await admin.from('diagnostic_pending_emails').update({ status: 'sent', confirmed_at: new Date().toISOString() }).eq('id', pending.id)

  // Emailing the FULL result IS releasing it — same reasoning as before this
  // review step existed. A partial send deliberately withholds the other
  // half, so it must NOT flip this.
  const isFullRelease = includeMcq && (lookup.result.frqScore ? includeFrq : true)
  if (isFullRelease) {
    await admin.from('diagnostic_attempts').update({ results_released: true }).eq('id', attemptId)
  }

  return NextResponse.json({ ok: true, sentTo, errors: errors.length > 0 ? errors : undefined })
}
