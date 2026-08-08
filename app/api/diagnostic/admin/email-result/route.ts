import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { getDiagnosticResult } from '@/lib/diagnosticResult'
import { resultEmailHtml } from '@/lib/diagnosticEmailTemplate'
import { resolveLeadContact } from '@/lib/diagnosticContact'
import { sendEmail } from '@/lib/email'

// Teacher-only: instead of emailing the student/parent directly, this sends
// a preview of the exact same email to the TEACHER's own address with a
// "Confirm & Send" link — nothing reaches the student/parent until they
// click through and confirm on app/teacher/diagnostics/confirm-email/[token]
// (see confirm-send-email/route.ts, which does the actual send). Doesn't
// require FRQ grading to be finished first — an all-MCQ test has nothing to
// review, and a teacher may reasonably want to send a partial update while
// FRQ review is still in progress.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const teacherEmail = caller.user.email
  if (!teacherEmail) return NextResponse.json({ error: 'No email on file for your account.' }, { status: 400 })

  const { attemptId, teacherNote, includeMcq = true, includeFrq = true, includeIntegrityNote = true } = await req.json() as {
    attemptId?: string
    teacherNote?: string | null
    includeMcq?: boolean
    includeFrq?: boolean
    includeIntegrityNote?: boolean
  }
  if (!attemptId) return NextResponse.json({ error: 'attemptId is required.' }, { status: 400 })
  if (!includeMcq && !includeFrq) return NextResponse.json({ error: 'Include at least one of Multiple Choice or Free Response.' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, lead_id, diagnostic_test_id')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 })

  const lead = await resolveLeadContact(admin, attempt.lead_id)
  if (!lead) return NextResponse.json({ error: 'No contact info found for this attempt.' }, { status: 404 })

  const lookup = await getDiagnosticResult(attemptId)
  if (lookup.status !== 'completed') return NextResponse.json({ error: 'This attempt is not completed yet.' }, { status: 400 })

  // Same rule as release-results: a late (overtime) submission can't be
  // emailed — even a partial MCQ-only send — until the teacher has
  // explicitly accepted it via OvertimeReviewPanel, since any send reveals
  // a score computed from not-yet-validated overtime work.
  if (lookup.result.submittedLate && lookup.result.overtimeAccepted !== true) {
    return NextResponse.json({ error: 'This attempt was submitted after the time limit — accept or reject the overtime score first.' }, { status: 400 })
  }

  const note = teacherNote?.trim() || null
  const token = randomUUID()

  const { error: pendingError } = await admin.from('diagnostic_pending_emails').insert({
    attempt_id: attemptId,
    teacher_note: note,
    include_mcq: includeMcq,
    include_frq: includeFrq,
    include_integrity_note: includeIntegrityNote,
    token,
  })
  if (pendingError) {
    console.error('email-result pending insert error:', pendingError)
    return NextResponse.json({ error: 'Could not queue this email for review — has add-diagnostic-pending-emails.sql been run yet?' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://classroom.mindspirelab.com'
  const { data: test } = await admin.from('diagnostic_tests').select('slug').eq('id', attempt.diagnostic_test_id).maybeSingle()
  const resultsUrl = `${baseUrl}/diagnostic/${test?.slug ?? ''}/results/${attemptId}`
  const confirmUrl = `${baseUrl}/teacher/diagnostics/confirm-email/${token}`

  const previewHtml = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px;">
      <div style="padding:14px 16px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; margin-bottom:16px;">
        <p style="margin:0 0 8px; font-weight:700; color:#3730a3; font-size:14px;">📋 This is a preview — nothing has been sent to the parent yet.</p>
        <p style="margin:0 0 12px; font-size:13px; color:#4338ca;">This is exactly what ${lead.parentEmail} will receive. Review it below, then confirm to actually send it.</p>
        <a href="${confirmUrl}" style="display:inline-block; background:#4338ca; color:#fff; text-decoration:none; padding:9px 16px; border-radius:8px; font-weight:600; font-size:13px;">Confirm &amp; Send to Parent →</a>
      </div>
      ${resultEmailHtml(lookup.result, lookup.result.studentName, resultsUrl, note, includeMcq, includeFrq, includeIntegrityNote)}
    </div>
  `

  try {
    await sendEmail({ to: teacherEmail, subject: `[Review] ${lookup.result.testTitle} results — ${lookup.result.studentName}`, html: previewHtml })
  } catch (e) {
    return NextResponse.json({ error: `Could not send the preview email: ${e instanceof Error ? e.message : 'failed'}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, pendingReview: true, sentPreviewTo: teacherEmail })
}
