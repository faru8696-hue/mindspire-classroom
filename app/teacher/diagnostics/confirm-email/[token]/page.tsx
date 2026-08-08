import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getDiagnosticResult } from '@/lib/diagnosticResult'
import { resultEmailHtml } from '@/lib/diagnosticEmailTemplate'
import ConfirmEmailActions from './ConfirmEmailActions'

// Reached from the "Confirm & Send" link in the preview email (see
// app/api/diagnostic/admin/email-result) — gated by the /teacher layout's
// own auth check, so only a logged-in teacher can reach this even if the
// link leaks. Nothing is sent to the student/parent until the button here
// is actually clicked (POST to confirm-send-email).
export default async function ConfirmEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = await createAdminClient()

  const { data: pending } = await admin
    .from('diagnostic_pending_emails')
    .select('attempt_id, teacher_note, include_mcq, include_frq, include_integrity_note, status')
    .eq('token', token)
    .maybeSingle()

  if (!pending) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-gray-500">This review link isn&rsquo;t valid — it may have already been used.</p>
        <Link href="/teacher/diagnostics" className="text-blue-600 text-sm hover:underline mt-3 inline-block">← Back to diagnostics</Link>
      </div>
    )
  }

  const attemptId = pending.attempt_id as string
  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, lead_id, diagnostic_test_id')
    .eq('id', attemptId)
    .maybeSingle()
  const { data: lead } = attempt
    ? await admin.from('diagnostic_leads').select('student_name, student_email, parent_name, parent_email').eq('id', attempt.lead_id).maybeSingle()
    : { data: null }
  const { data: test } = attempt
    ? await admin.from('diagnostic_tests').select('slug').eq('id', attempt.diagnostic_test_id).maybeSingle()
    : { data: null }

  const lookup = await getDiagnosticResult(attemptId)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://classroom.mindspirelab.com'
  const resultsUrl = `${baseUrl}/diagnostic/${test?.slug ?? ''}/results/${attemptId}`

  const previewHtml = lookup.status === 'completed' && lead
    ? resultEmailHtml(
        lookup.result, lead.parent_name, resultsUrl,
        (pending.teacher_note as string | null), pending.include_mcq as boolean, pending.include_frq as boolean, pending.include_integrity_note as boolean,
      )
    : null

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Link href="/teacher/diagnostics" className="text-blue-600 text-sm hover:underline">← Back to diagnostics</Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h1 className="font-bold text-gray-800 mb-1">Review Before Sending</h1>
        {lead && <p className="text-xs text-gray-500 mb-4">To {lead.student_email} and {lead.parent_email}</p>}

        {pending.status !== 'pending' ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-600 font-semibold text-center">
            {pending.status === 'sent' ? '✓ This was already sent.' : 'This email was cancelled.'}
          </div>
        ) : previewHtml ? (
          <>
            <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            <ConfirmEmailActions token={token} />
          </>
        ) : (
          <p className="text-gray-500 text-sm">This attempt isn&rsquo;t available to preview anymore.</p>
        )}
      </div>
    </div>
  )
}
