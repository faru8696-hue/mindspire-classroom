import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Two modes, both keyed by question:
//  - default: a cheap change-detection poll — {studentId: updated_at} only,
//    no image data. The live classroom grid polls this every few seconds.
//  - ?studentId=<id>: the actual canvas_data (a full base64 PNG, can be
//    hundreds of KB) for exactly one student, fetched only when that
//    student's updated_at moved since the caller last saw it.
// Splitting these apart is the fix for a real production incident: this
// route used to always return every student's canvas_data, polled every 5s
// while a teacher had the grid open — for a full class period that alone
// could be gigabytes of egress for images that hadn't even changed.
export async function GET(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const questionId = req.nextUrl.searchParams.get('questionId')
  if (!questionId) {
    return NextResponse.json({ error: 'Missing questionId' }, { status: 400 })
  }
  const studentId = req.nextUrl.searchParams.get('studentId')

  const { data: subs } = await admin
    .from('submissions')
    .select('id, student_id')
    .eq('question_id', questionId)

  const submissionIds = (subs ?? []).map(s => s.id)
  if (!submissionIds.length) {
    return studentId ? NextResponse.json({ canvasData: null }) : NextResponse.json({ versionByStudent: {} })
  }
  const studentBySubmission = new Map((subs ?? []).map(s => [s.id, s.student_id]))

  if (studentId) {
    const mySubmissionId = [...studentBySubmission.entries()].find(([, sid]) => sid === studentId)?.[0]
    if (!mySubmissionId) return NextResponse.json({ canvasData: null })
    const { data: feedback } = await admin
      .from('feedback')
      .select('canvas_data')
      .eq('submission_id', mySubmissionId)
      .maybeSingle()
    return NextResponse.json({ canvasData: feedback?.canvas_data ?? null })
  }

  const { data: feedback } = await admin
    .from('feedback')
    .select('submission_id, updated_at')
    .in('submission_id', submissionIds)

  const versionByStudent: Record<string, string> = {}
  for (const f of feedback ?? []) {
    const sid = studentBySubmission.get(f.submission_id)
    if (sid) versionByStudent[sid] = f.updated_at
  }

  return NextResponse.json({ versionByStudent })
}
