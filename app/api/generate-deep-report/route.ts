import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { generateDeepStudentReport, DeepReportStruggleItem } from '@/lib/gemini'
import { computeStudentReport, computeClassComparison } from '@/lib/studentReport'
import { isQuotaExceeded, isOverloaded } from '@/lib/geminiErrors'

// Teacher-only: analyzes a student's actual recent struggling submissions
// (images of handwritten work + typed answers) and writes a specific
// diagnostic narrative, caching it in student_deep_reports so it doesn't
// need to be regenerated on every page view or email send.
//
// The whiteboard snapshots are rendered client-side (browser <canvas>, via
// renderBoardSnapshot) and sent here already as data URLs — there's no
// server-side canvas library in this project, and adding one (node-canvas
// etc.) is a native-binary dependency that's risky to introduce just for
// this, so the client does the rendering. Everything else (name, mastery,
// trend, class comparison) is recomputed server-side rather than trusted
// from the client, both for correctness and because classmate data should
// never be assembled client-side.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId, items } = await req.json() as {
    studentId: string
    items: DeepReportStruggleItem[]
  }
  if (!studentId || !items || items.length === 0) {
    return NextResponse.json({ error: 'Missing studentId or items' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const report = await computeStudentReport(admin, studentId)
  if (!report) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const studentFirstName = (report.student.nickname || report.student.full_name).split(' ')[0]

  const { data: extProfile } = await admin.from('profiles').select('parent_name').eq('id', studentId).maybeSingle()
  const parentName = (extProfile as { parent_name?: string } | null)?.parent_name || null

  const { data: teacherNoteRow } = await admin
    .from('teacher_notes')
    .select('content')
    .eq('teacher_id', caller.profile.id)
    .eq('student_id', studentId)
    .maybeSingle()
  const teacherNotes = teacherNoteRow?.content?.trim() || null

  const masterySummary = report.masteryRows.length > 0
    ? report.masteryRows.map(t => `${t.title}: ${t.pct}%`).join('; ')
    : 'No graded work yet.'

  const trendSummary = report.trend.length > 0
    ? report.trend.map(p => `${p.date}: ${p.pct}% (${p.cumulativeGraded} questions graded so far)`).join('; ')
    : 'Not enough history yet to show a trend.'

  const engagementSummary = `Active on ${report.daysActive} distinct day${report.daysActive === 1 ? '' : 's'}; ${report.submissionsLast14Days} submission${report.submissionsLast14Days === 1 ? '' : 's'} in the last 14 days.`

  const classBreakdownSummary = report.classBreakdown.length > 1
    ? report.classBreakdown.map(c => `${c.className}${c.role ? ` (${c.role})` : ''}: ${c.overallPct}% overall (${c.graded} questions graded)`).join('\n')
    : null

  let classComparisonSummary: string | null = null
  try {
    const comparison = await computeClassComparison(admin, report)
    if (comparison && comparison.classSize > 0) {
      const lines = [`Overall: ${studentFirstName} ${report.overallPct}% vs. class average ${comparison.classAvgOverallPct}% (${comparison.classSize} classmates with graded work)`]
      for (const t of comparison.perTopic) {
        lines.push(`${t.title}: ${studentFirstName} ${t.studentPct}% vs. class average ${t.classAvgPct}% (n=${t.classSize})`)
      }
      classComparisonSummary = lines.join('\n')
    }
  } catch (err) {
    console.error('computeClassComparison failed, continuing without it:', err)
  }

  try {
    const reportText = await generateDeepStudentReport(
      {
        studentFirstName, parentName, masterySummary, trendSummary, engagementSummary, classComparisonSummary,
        classBreakdownSummary, isFoundationalAdvancedPairing: report.isFoundationalAdvancedPairing, teacherNotes,
      },
      items,
    )

    await admin.from('student_deep_reports').upsert({
      student_id: studentId,
      report_text: reportText,
      generated_by: caller.profile.id,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'student_id' })

    return NextResponse.json({ reportText })
  } catch (err) {
    console.error('generate-deep-report error:', err)
    const message = err instanceof Error ? err.message : String(err)
    if (isQuotaExceeded(message)) {
      return NextResponse.json({ error: 'AI report: daily limit reached. Try again tomorrow.' }, { status: 429 })
    }
    return NextResponse.json(
      { error: isOverloaded(message) ? 'AI report is not available right now. Please try again in a bit.' : `Report generation failed: ${message}` },
      { status: 503 }
    )
  }
}
