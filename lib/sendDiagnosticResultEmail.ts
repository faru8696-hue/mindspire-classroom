import { getDiagnosticResult } from './diagnosticResult'
import { resolveLeadContact } from './diagnosticContact'
import { resultEmailHtml } from './diagnosticEmailTemplate'
import { sendEmail } from './email'
import { createAdminClient } from './supabase/server'

export interface SendResultEmailParams {
  attemptId: string
  teacherNote: string | null
  includeMcq: boolean
  includeFrq: boolean
  includeIntegrityNote: boolean
}

export type SendResultEmailOutcome =
  | { ok: true; sentTo: string[]; errors?: string[] }
  | { ok: false; error: string; status: number }

// The actual send — to both the student and parent contact on file for this
// attempt. Shared by confirm-send-email (reached via the "Confirm & Send"
// link after a preview) and email-result-direct (the immediate "Send to
// Parent" option), so both paths render and deliver byte-for-byte the same
// email instead of drifting apart over time.
export async function sendDiagnosticResultEmail(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  { attemptId, teacherNote, includeMcq, includeFrq, includeIntegrityNote }: SendResultEmailParams,
): Promise<SendResultEmailOutcome> {
  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, lead_id, diagnostic_test_id')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return { ok: false, error: 'Attempt not found.', status: 404 }

  const lead = await resolveLeadContact(admin, attempt.lead_id)
  if (!lead) return { ok: false, error: 'No contact info found for this attempt.', status: 404 }

  const lookup = await getDiagnosticResult(attemptId)
  if (lookup.status !== 'completed') return { ok: false, error: 'This attempt is not completed yet.', status: 400 }

  // A late (overtime) submission can't be emailed — even a partial MCQ-only
  // send — until the teacher has explicitly accepted it via
  // OvertimeReviewPanel, since any send reveals a score computed from
  // not-yet-validated overtime work.
  if (lookup.result.submittedLate && lookup.result.overtimeAccepted !== true) {
    return { ok: false, error: 'This attempt was submitted after the time limit — accept or reject the overtime score first.', status: 400 }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://classroom.mindspirelab.com'
  const { data: test } = await admin.from('diagnostic_tests').select('slug').eq('id', attempt.diagnostic_test_id).maybeSingle()
  const resultsUrl = `${baseUrl}/diagnostic/${test?.slug ?? ''}/results/${attemptId}`
  const subject = `${lookup.result.testTitle} results — ${lookup.result.studentName}`

  const sentTo: string[] = []
  const errors: string[] = []

  try {
    await sendEmail({ to: lead.studentEmail, subject, html: resultEmailHtml(lookup.result, lead.studentName, resultsUrl, teacherNote, includeMcq, includeFrq, includeIntegrityNote) })
    sentTo.push(lead.studentEmail)
  } catch (e) {
    errors.push(`student (${lead.studentEmail}): ${e instanceof Error ? e.message : 'failed'}`)
  }

  try {
    await sendEmail({ to: lead.parentEmail, subject, html: resultEmailHtml(lookup.result, lead.parentName, resultsUrl, teacherNote, includeMcq, includeFrq, includeIntegrityNote) })
    sentTo.push(lead.parentEmail)
  } catch (e) {
    errors.push(`parent (${lead.parentEmail}): ${e instanceof Error ? e.message : 'failed'}`)
  }

  if (sentTo.length === 0) {
    return { ok: false, error: `Could not send either email. ${errors.join('; ')}`, status: 500 }
  }

  // Emailing the FULL result IS releasing it — the email body already
  // contains the complete score, and its "View Full Results" link would
  // otherwise land on the "your teacher will share this soon" holding page.
  // A partial send deliberately withholds the other half, so it must NOT
  // flip this.
  const isFullRelease = includeMcq && (lookup.result.frqScore ? includeFrq : true)
  if (isFullRelease) {
    await admin.from('diagnostic_attempts').update({ results_released: true }).eq('id', attemptId)
  }

  return { ok: true, sentTo, errors: errors.length > 0 ? errors : undefined }
}
