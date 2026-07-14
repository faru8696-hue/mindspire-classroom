import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { generateDeepStudentReport, DeepReportStruggleItem } from '@/lib/gemini'
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
// this, so the client does the rendering and this route just orchestrates
// Gemini + caching.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId, displayName, masterySummary, items } = await req.json() as {
    studentId: string
    displayName: string
    masterySummary: string
    items: DeepReportStruggleItem[]
  }
  if (!studentId || !items || items.length === 0) {
    return NextResponse.json({ error: 'Missing studentId or items' }, { status: 400 })
  }

  const admin = await createAdminClient()

  try {
    const reportText = await generateDeepStudentReport(displayName, masterySummary, items)

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
