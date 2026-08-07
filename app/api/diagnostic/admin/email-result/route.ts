import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { getDiagnosticResult } from '@/lib/diagnosticResult'
import { computeTotalScore, applyIntegrityDeduction } from '@/lib/diagnosticGrading'
import { sendEmail } from '@/lib/email'
import type { DiagnosticResultData } from '@/components/diagnostic/DiagnosticResultSummary'

// Sent in both the student's and parent's copy. The "left the tab" count is
// a weak, high-false-positive signal (a notification, a calculator app, an
// accidental alt-tab all trigger it too, same reasoning as the teacher
// attempt page), so it's worded as a possibility, not an accusation.
function integrityNoteHtml(result: DiagnosticResultData, rawPct: number, adjustedPct: number): string {
  if (result.tabSwitchCount <= 0) return ''
  const hasDeduction = result.integrityDeductionPct > 0
  return `
    <div style="padding:14px 16px; background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; margin:16px 0;">
      <p style="margin:0 0 4px; font-weight:700; color:#9a3412; font-size:13px;">⚠️ Test Integrity Note</p>
      ${hasDeduction ? `
      <p style="margin:0 0 6px; font-size:13px; color:#7c2d12;">
        Score before deduction: <strong>${rawPct}%</strong> &nbsp;→&nbsp; after deduction: <strong>${adjustedPct}%</strong> (&minus;${result.integrityDeductionPct}%)
      </p>` : ''}
      <p style="margin:0; font-size:13px; color:#7c2d12;">
        ${result.studentName} left the test window <strong>${result.tabSwitchCount}</strong> time${result.tabSwitchCount === 1 ? '' : 's'}${result.tabSwitchSeconds > 0 ? `, totaling <strong>${result.tabSwitchSeconds}s</strong> away` : ''} while the test was in progress.
        ${result.integrityLikelyCheating
          ? 'This pattern is hard to explain as innocent (a long time away, or leaving very frequently) and has been flagged for teacher review.'
          : 'This can happen for innocent reasons (a notification, an accidental click), but it can also indicate a chance of cheating — for example, looking up answers elsewhere.'}
      </p>
    </div>
  `
}

// Only shown once a meaningful share of the test was actually left blank,
// so it reads as a real observation rather than a blanket excuse for a low
// score — same threshold as the in-app results page and the PDF.
function lowScoreReasonHtml(result: DiagnosticResultData, adjustedPct: number): string {
  const unansweredPct = result.totalQuestionCount > 0 ? result.unansweredCount / result.totalQuestionCount : 0
  if (adjustedPct >= 70 || unansweredPct < 0.15) return ''
  return `
    <div style="padding:12px 14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; margin:16px 0; font-size:13px; color:#1e3a8a;">
      ℹ️ ${result.unansweredCount} of ${result.totalQuestionCount} questions were left unanswered, which may reflect the test time running out rather than the material not being understood.
    </div>
  `
}

function teacherNoteHtml(note: string | null): string {
  if (!note) return ''
  return `
    <div style="padding:14px 16px; background:#f5f3ff; border:1px solid #ddd6fe; border-radius:8px; margin:16px 0;">
      <p style="margin:0 0 4px; font-weight:700; color:#5b21b6; font-size:13px;">📝 Note from the Teacher</p>
      <p style="margin:0; font-size:13px; color:#4c1d95; white-space:pre-wrap;">${note}</p>
    </div>
  `
}

function resultEmailHtml(result: DiagnosticResultData, greetingName: string, resultsUrl: string, teacherNote: string | null): string {
  const frq = result.frqScore
  const rawTotal = computeTotalScore(result.correctCount, result.totalCount, frq)
  const total = applyIntegrityDeduction(rawTotal, result.integrityDeductionPct)

  const topicRows = result.topicScores.map(t => `
    <tr>
      <td style="padding:6px 0; font-size:13px; color:#374151;">${t.topicTitle}</td>
      <td style="padding:6px 0; font-size:13px; color:#374151; text-align:right; font-weight:600;">${t.correct}/${t.total} (${t.pct}%)</td>
    </tr>
  `).join('')

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 520px; color:#111827;">
      <p>Hi ${greetingName},</p>
      <p>Here are ${result.studentName}&rsquo;s results for <strong>${result.testTitle}</strong>, taken on ${result.dateTaken}.</p>

      <div style="padding:16px; background:#eef2ff; border-radius:8px; text-align:center; margin:16px 0;">
        <div style="font-size:34px; font-weight:800; color:#4338ca;">${total.pct}%</div>
        <div style="font-size:13px; color:#6b7280;">${total.earned}/${total.possible} total${!total.fullyGraded ? ' — provisional, FRQ review still in progress' : ''}</div>
      </div>

      <table style="width:100%; margin:0 0 16px;">
        <tr>
          <td style="padding:12px; background:#f9fafb; border-radius:8px; text-align:center;">
            <div style="font-size:22px; font-weight:800; color:#1d4ed8;">${result.scorePct}%</div>
            <div style="font-size:12px; color:#6b7280;">Multiple Choice — ${result.correctCount}/${result.totalCount}</div>
          </td>
          ${frq ? `
          <td style="width:12px;"></td>
          <td style="padding:12px; background:#faf5ff; border-radius:8px; text-align:center;">
            <div style="font-size:22px; font-weight:800; color:#7e22ce;">${frq.gradedCount === 0 ? `${frq.totalPoints} pts` : `${frq.earnedPoints}/${frq.gradedCount === frq.totalCount ? frq.totalPoints : frq.gradedPoints} pts`}</div>
            <div style="font-size:12px; color:#6b7280;">Free Response${frq.gradedCount < frq.totalCount ? ` (${frq.gradedCount}/${frq.totalCount} graded)` : ''}</div>
          </td>` : ''}
        </tr>
      </table>

      ${topicRows ? `
      <p style="font-weight:600; margin-bottom:4px;">Performance by Topic</p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">${topicRows}</table>
      ` : ''}

      ${teacherNoteHtml(teacherNote)}

      ${integrityNoteHtml(result, rawTotal.pct, total.pct)}

      ${lowScoreReasonHtml(result, total.pct)}

      <a href="${resultsUrl}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-weight:600; font-size:14px;">View Full Results</a>

      <p style="color:#9ca3af; font-size:12px; margin-top:24px;">Sent by Mindspire Lab.</p>
    </div>
  `
}

// Teacher-only: emails the current results (MCQ + FRQ breakdown, topic
// performance, link to the full page) to both the student and parent
// contact on file for this attempt. Doesn't require FRQ grading to be
// finished first — an all-MCQ test has nothing to review, and a teacher
// may reasonably want to send a partial update while FRQ review is
// still in progress (the email honestly reflects "reviewed" vs not).
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { attemptId, teacherNote } = await req.json() as { attemptId?: string; teacherNote?: string | null }
  if (!attemptId) return NextResponse.json({ error: 'attemptId is required.' }, { status: 400 })

  const admin = await createAdminClient()
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://classroom.mindspirelab.com'
  const { data: test } = await admin.from('diagnostic_tests').select('slug').eq('id', attempt.diagnostic_test_id).maybeSingle()
  const resultsUrl = `${baseUrl}/diagnostic/${test?.slug ?? ''}/results/${attemptId}`

  const subject = `${lookup.result.testTitle} results — ${lookup.result.studentName}`
  const sentTo: string[] = []
  const errors: string[] = []

  const note = teacherNote?.trim() || null

  try {
    await sendEmail({ to: lead.student_email, subject, html: resultEmailHtml(lookup.result, lead.student_name, resultsUrl, note) })
    sentTo.push(lead.student_email)
  } catch (e) {
    errors.push(`student (${lead.student_email}): ${e instanceof Error ? e.message : 'failed'}`)
  }

  try {
    await sendEmail({ to: lead.parent_email, subject, html: resultEmailHtml(lookup.result, lead.parent_name, resultsUrl, note) })
    sentTo.push(lead.parent_email)
  } catch (e) {
    errors.push(`parent (${lead.parent_email}): ${e instanceof Error ? e.message : 'failed'}`)
  }

  if (sentTo.length === 0) {
    return NextResponse.json({ error: `Could not send either email. ${errors.join('; ')}` }, { status: 500 })
  }

  // Emailing the result IS releasing it — the email body already contains
  // the score, and its "View Full Results" link would otherwise land on
  // the "your teacher will share this soon" holding page. Keep the
  // release toggle (and the student results page) in sync with reality.
  await admin.from('diagnostic_attempts').update({ results_released: true }).eq('id', attemptId)

  return NextResponse.json({ ok: true, sentTo, errors: errors.length > 0 ? errors : undefined })
}
