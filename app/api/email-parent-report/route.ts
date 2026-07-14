import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { computeStudentReport, computeClassComparison } from '@/lib/studentReport'
import { sendEmail } from '@/lib/email'

function masteryBarColor(pct: number): string {
  if (pct >= 80) return '#16a34a'
  if (pct >= 50) return '#d97706'
  return '#dc2626'
}

// Email-safe "sparkline" — most email clients strip SVG and many strip
// flexbox, but a <table> with bottom-aligned colored <div>s renders reliably
// everywhere (the classic HTML-email bar-chart trick).
function trendSparklineHtml(trend: { date: string; pct: number }[]): string {
  if (trend.length < 2) return ''
  const maxBarHeight = 60
  const cells = trend.map(p => {
    const h = Math.max(4, Math.round((p.pct / 100) * maxBarHeight))
    const color = p.pct >= 80 ? '#16a34a' : p.pct >= 50 ? '#d97706' : '#dc2626'
    return `<td style="vertical-align:bottom; text-align:center; padding:0 3px;">
      <div style="background:${color}; width:14px; height:${h}px; border-radius:3px 3px 0 0; margin:0 auto;"></div>
    </td>`
  }).join('')
  return `
    <table style="border-collapse:collapse; margin-top:6px;"><tr>${cells}</tr></table>
    <p style="font-size:11px; color:#9ca3af; margin:2px 0 0;">${new Date(trend[0].date).toLocaleDateString()} → ${new Date(trend[trend.length - 1].date).toLocaleDateString()} (accuracy over time)</p>
  `
}

// Turns the AI-generated deep report's plain-text section headers ("Overall
// Pattern:", "Specific Struggles:", etc.) into simple HTML paragraphs so the
// email doesn't just dump one giant text blob.
function deepReportToHtml(reportText: string): string {
  const paragraphs = reportText.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  return paragraphs.map(p => {
    const headingMatch = p.match(/^([A-Za-z][A-Za-z /]{2,40}):\s*([\s\S]*)$/)
    if (headingMatch) {
      const [, heading, rest] = headingMatch
      return `<p style="margin:16px 0 4px;"><strong style="color:#5b21b6;">${heading}:</strong></p><p style="margin:0 0 8px; white-space:pre-wrap;">${rest.replace(/\n/g, '<br/>')}</p>`
    }
    return `<p style="margin:0 0 8px; white-space:pre-wrap;">${p.replace(/\n/g, '<br/>')}</p>`
  }).join('')
}

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId } = await req.json()
  if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: teacherProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', caller.profile.id)
    .maybeSingle()
  const teacherName = teacherProfile?.full_name ?? 'your teacher'

  const { data: studentProfile } = await admin
    .from('profiles')
    .select('parent_email, parent_name, full_name, nickname')
    .eq('id', studentId)
    .single()
  if (!studentProfile) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  if (!studentProfile.parent_email) {
    return NextResponse.json({ error: 'This student has no parent email on file yet.' }, { status: 400 })
  }

  const { data: deepReportRow } = await admin
    .from('student_deep_reports')
    .select('report_text, generated_at')
    .eq('student_id', studentId)
    .maybeSingle()

  const report = await computeStudentReport(admin, studentId)
  if (!report) return NextResponse.json({ error: 'Could not compute report' }, { status: 404 })

  const displayName = report.student.nickname || report.student.full_name
  const firstName = displayName.split(' ')[0]
  const className = report.enrolledClasses.map(c => c.title).join(', ')
  const classComparison = await computeClassComparison(admin, report).catch(() => null)

  const masteryRowsHtml = report.masteryRows.map(t => `
    <tr>
      <td style="padding:6px 8px; font-size:13px; color:#374151;">${t.title}</td>
      <td style="padding:6px 8px; width:120px;">
        <div style="background:#f3f4f6; border-radius:6px; height:10px; overflow:hidden;">
          <div style="background:${masteryBarColor(t.pct)}; height:10px; width:${t.pct}%;"></div>
        </div>
      </td>
      <td style="padding:6px 8px; font-size:13px; font-weight:600; color:${masteryBarColor(t.pct)}; text-align:right;">${t.pct}%</td>
    </tr>
  `).join('')

  const deepSectionHtml = deepReportRow?.report_text
    ? `<div style="margin-top:24px; padding:16px; background:#faf5ff; border:1px solid #e9d5ff; border-radius:12px;">
         <p style="margin:0 0 8px; font-size:12px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:#7c3aed;">Deep Review — What ${firstName} Is Actually Struggling With</p>
         ${deepReportToHtml(deepReportRow.report_text)}
       </div>`
    : ''

  const classComparisonHtml = classComparison && classComparison.perTopic.length > 0
    ? `<p style="font-weight:600; margin-top:20px; margin-bottom:4px;">${firstName} vs. Classmates <span style="font-weight:400; color:#9ca3af; font-size:12px;">(class average ${classComparison.classAvgOverallPct}% overall, ${classComparison.classSize} classmates compared)</span></p>
       <table style="width:100%; border-collapse:collapse;">
         ${classComparison.perTopic.map(t => `
           <tr>
             <td style="padding:5px 8px; font-size:13px; color:#374151;">${t.title}</td>
             <td style="padding:5px 8px; font-size:13px; text-align:right; white-space:nowrap;"><strong style="color:#6d28d9;">${firstName}: ${t.studentPct}%</strong> &nbsp; <span style="color:#9ca3af;">class: ${t.classAvgPct}%</span></td>
           </tr>
         `).join('')}
       </table>`
    : ''

  const trendHtml = report.trend.length >= 2
    ? `<p style="font-weight:600; margin-top:20px; margin-bottom:2px;">Accuracy Trend</p>${trendSparklineHtml(report.trend)}`
    : ''

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; color:#111827;">
      <p>Hi${studentProfile.parent_name ? ` ${studentProfile.parent_name}` : ''},</p>
      <p>Here is ${firstName}'s chemistry progress report${className ? ` for ${className}` : ''}, prepared by their teacher.</p>

      <div style="display:flex; gap:12px; margin:16px 0;">
        <div style="background:#f5f3ff; border-radius:12px; padding:12px 16px; text-align:center;">
          <div style="font-size:24px; font-weight:700; color:#6d28d9;">${report.overallPct}%</div>
          <div style="font-size:11px; color:#6b7280;">Overall mastery</div>
        </div>
      </div>

      <p style="font-size:13px; color:#6b7280;">✓ ${report.correct} correct &nbsp;·&nbsp; ~ ${report.partial} partial &nbsp;·&nbsp; ✗ ${report.incorrect} need work &nbsp;·&nbsp; ${report.graded} questions graded</p>
      <p style="font-size:12px; color:#9ca3af;">Active on ${report.daysActive} day${report.daysActive === 1 ? '' : 's'}, ${report.submissionsLast14Days} submission${report.submissionsLast14Days === 1 ? '' : 's'} in the last 2 weeks.</p>

      ${report.masteryRows.length > 0 ? `
        <p style="font-weight:600; margin-top:20px; margin-bottom:4px;">Mastery by topic</p>
        <table style="width:100%; border-collapse:collapse;">${masteryRowsHtml}</table>
      ` : ''}

      ${trendHtml}

      ${classComparisonHtml}

      ${deepSectionHtml}

      <p style="color:#9ca3af; font-size:12px; margin-top:24px;">This report was generated by Mindspire Lab Classroom on behalf of ${teacherName}. Reply to this email or contact the teacher directly with any questions about ${firstName}'s progress.</p>
    </div>
  `

  try {
    await sendEmail({
      to: studentProfile.parent_email,
      subject: `${displayName}'s Chemistry Progress Report`,
      html,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed to send email: ${message}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true, sentTo: studentProfile.parent_email })
}
