import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Records a "help" or "submitted" alert from a student, with dedup: if the
// student already has an unread alert of the same type for this question
// (e.g. they clicked the button more than once), we bump its timestamp
// instead of inserting a new row. This is what stops the teacher's
// notification feed from filling up with 100 near-identical entries — the
// student can only ever have ONE outstanding "help" and ONE outstanding
// "submitted" alert per question at a time.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type, studentId, questionId, classId } = await req.json()
  if (caller.user.id !== studentId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!type || !questionId || !classId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // A "submitted" alert on a question that was ALREADY graded means the
  // student corrected their work and is resubmitting it — the old grade no
  // longer reflects the current work, so clear it back to ungraded. This is
  // what makes the teacher's "needs review" flag (which only looks at
  // unread submitted/help alerts with no grade) pick this back up
  // automatically, instead of a corrected answer silently sitting under a
  // stale "correct"/"incorrect" badge that no longer matches the board.
  let wasRegraded = false
  if (type === 'submitted') {
    const { data: submission } = await admin
      .from('submissions')
      .select('id')
      .eq('student_id', studentId)
      .eq('question_id', questionId)
      .maybeSingle()
    if (submission?.id) {
      const { data: existingFeedback } = await admin
        .from('feedback')
        .select('id, grade')
        .eq('submission_id', submission.id)
        .maybeSingle()
      if (existingFeedback?.id && existingFeedback.grade) {
        await admin.from('feedback').update({ grade: null }).eq('id', existingFeedback.id)
        wasRegraded = true
      }
    }
  }

  const { data: existing } = await admin
    .from('notifications')
    .select('id')
    .eq('student_id', studentId)
    .eq('question_id', questionId)
    .eq('type', type)
    .eq('read', false)
    .maybeSingle()

  if (existing?.id) {
    await admin.from('notifications').update({ created_at: now, read: false }).eq('id', existing.id)
    return NextResponse.json({ id: existing.id, created: false, wasRegraded })
  }

  const { data: inserted, error } = await admin
    .from('notifications')
    .insert({ type, student_id: studentId, question_id: questionId, class_id: classId, created_at: now })
    .select('id')
    .single()

  // 23505 = unique_violation — a concurrent click raced us and won; treat as
  // a dedup hit rather than an error.
  if (error?.code === '23505') {
    const { data: race } = await admin
      .from('notifications')
      .select('id')
      .eq('student_id', studentId).eq('question_id', questionId).eq('type', type).eq('read', false)
      .maybeSingle()
    return NextResponse.json({ id: race?.id ?? null, created: false, wasRegraded })
  }
  if (error) {
    console.error('student-alert insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: inserted.id, created: true, wasRegraded })
}
