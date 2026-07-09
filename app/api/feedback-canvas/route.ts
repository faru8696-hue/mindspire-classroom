import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Returns the teacher's annotation layer (feedback.canvas_data) for every
// student's submission on a question, keyed by student_id. Used to poll the
// live grid so a tile shows what the teacher already wrote on that board —
// the submissions/feedback tables are RLS-gated with no working SELECT
// policy for the teacher client, so this has to go through service role
// rather than a direct client read or postgres_changes subscription.
export async function GET(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const questionId = req.nextUrl.searchParams.get('questionId')
  if (!questionId) {
    return NextResponse.json({ error: 'Missing questionId' }, { status: 400 })
  }

  const { data: subs } = await admin
    .from('submissions')
    .select('id, student_id')
    .eq('question_id', questionId)

  const submissionIds = (subs ?? []).map(s => s.id)
  if (!submissionIds.length) return NextResponse.json({ canvasByStudent: {} })

  const { data: feedback } = await admin
    .from('feedback')
    .select('submission_id, canvas_data')
    .in('submission_id', submissionIds)

  const studentBySubmission = new Map((subs ?? []).map(s => [s.id, s.student_id]))
  const canvasByStudent: Record<string, string> = {}
  for (const f of feedback ?? []) {
    if (!f.canvas_data) continue
    const studentId = studentBySubmission.get(f.submission_id)
    if (studentId) canvasByStudent[studentId] = f.canvas_data
  }

  return NextResponse.json({ canvasByStudent })
}
