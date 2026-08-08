import { computeTotalScore, applyIntegrityDeduction } from './diagnosticGrading'
import type { DiagnosticResultData } from '@/components/diagnostic/DiagnosticResultSummary'

// Shared between app/api/diagnostic/admin/email-result (sends a preview to
// the teacher) and .../confirm-send-email (sends the real thing to the
// student/parent once confirmed) — both must render byte-for-byte the same
// email, so this lives in one place rather than being duplicated.

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

export function resultEmailHtml(
  result: DiagnosticResultData, greetingName: string, resultsUrl: string, teacherNote: string | null,
  includeMcq: boolean, includeFrq: boolean, includeIntegrityNote: boolean,
): string {
  const frq = includeFrq ? result.frqScore : null
  const isPartial = !(includeMcq && (result.frqScore ? includeFrq : true))

  // The headline is whichever single score was chosen when only one is
  // included — there's no honest "combined total" to show when the other
  // half was deliberately left out. The topic-by-topic table is skipped
  // for a partial release since mastery bars blend MCQ+FRQ within a topic
  // and can't be cleanly split into "MCQ-only" without re-querying per
  // question — not worth the complexity for what's meant to be a quick
  // partial update.
  let headlinePct: number, headlineLine: string
  if (includeMcq && includeFrq && result.frqScore) {
    const rawTotal = computeTotalScore(result.correctCount, result.totalCount, result.frqScore)
    const total = applyIntegrityDeduction(rawTotal, result.integrityDeductionPct)
    headlinePct = total.pct
    headlineLine = `${total.earned}/${total.possible} total${!total.fullyGraded ? ' — provisional, FRQ review still in progress' : ''}`
  } else if (includeMcq) {
    const rawTotal = computeTotalScore(result.correctCount, result.totalCount, null)
    const total = applyIntegrityDeduction(rawTotal, result.integrityDeductionPct)
    headlinePct = total.pct
    headlineLine = `${total.earned}/${total.possible} — Multiple Choice`
  } else {
    // FRQ only
    const fq = result.frqScore
    headlinePct = fq && fq.gradedPoints > 0 ? Math.round((fq.earnedPoints / fq.gradedPoints) * 100) : 0
    headlineLine = fq
      ? `${fq.gradedCount === 0 ? `${fq.totalPoints} pts` : `${fq.earnedPoints}/${fq.gradedCount === fq.totalCount ? fq.totalPoints : fq.gradedPoints} pts`} — Free Response${fq.gradedCount < fq.totalCount ? ` (${fq.gradedCount}/${fq.totalCount} graded)` : ''}`
      : ''
  }

  const rawTotalForNotes = computeTotalScore(result.correctCount, result.totalCount, result.frqScore)
  const adjustedTotalForNotes = applyIntegrityDeduction(rawTotalForNotes, result.integrityDeductionPct)

  const topicRows = !isPartial ? result.topicScores.map(t => `
    <tr>
      <td style="padding:6px 0; font-size:13px; color:#374151;">${t.topicTitle}</td>
      <td style="padding:6px 0; font-size:13px; color:#374151; text-align:right; font-weight:600;">${t.correct}/${t.total} (${t.pct}%)</td>
    </tr>
  `).join('') : ''

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 520px; color:#111827;">
      <p>Hi ${greetingName},</p>
      <p>Here are ${result.studentName}&rsquo;s results for <strong>${result.testTitle}</strong>, taken on ${result.dateTaken}.${isPartial ? ' This is a partial update — more will follow.' : ''}</p>

      <div style="padding:16px; background:#eef2ff; border-radius:8px; text-align:center; margin:16px 0;">
        <div style="font-size:34px; font-weight:800; color:#4338ca;">${headlinePct}%</div>
        <div style="font-size:13px; color:#6b7280;">${headlineLine}</div>
      </div>

      ${includeMcq && includeFrq && frq ? `
      <table style="width:100%; margin:0 0 16px;">
        <tr>
          <td style="padding:12px; background:#f9fafb; border-radius:8px; text-align:center;">
            <div style="font-size:22px; font-weight:800; color:#1d4ed8;">${result.scorePct}%</div>
            <div style="font-size:12px; color:#6b7280;">Multiple Choice — ${result.correctCount}/${result.totalCount}</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:12px; background:#faf5ff; border-radius:8px; text-align:center;">
            <div style="font-size:22px; font-weight:800; color:#7e22ce;">${frq.gradedCount === 0 ? `${frq.totalPoints} pts` : `${frq.earnedPoints}/${frq.gradedCount === frq.totalCount ? frq.totalPoints : frq.gradedPoints} pts`}</div>
            <div style="font-size:12px; color:#6b7280;">Free Response${frq.gradedCount < frq.totalCount ? ` (${frq.gradedCount}/${frq.totalCount} graded)` : ''}</div>
          </td>
        </tr>
      </table>
      ` : ''}

      ${topicRows ? `
      <p style="font-weight:600; margin-bottom:4px;">Performance by Topic</p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">${topicRows}</table>
      ` : ''}

      ${teacherNoteHtml(teacherNote)}

      ${includeIntegrityNote ? integrityNoteHtml(result, rawTotalForNotes.pct, adjustedTotalForNotes.pct) : ''}

      ${lowScoreReasonHtml(result, adjustedTotalForNotes.pct)}

      ${isPartial
        ? `<p style="font-size:13px; color:#6b7280;">Your teacher will share the complete breakdown separately.</p>`
        : `<a href="${resultsUrl}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:10px 18px; border-radius:8px; font-weight:600; font-size:14px;">View Full Results</a>`}

      <p style="color:#9ca3af; font-size:12px; margin-top:24px;">Sent by Mindspire Lab.</p>
    </div>
  `
}
