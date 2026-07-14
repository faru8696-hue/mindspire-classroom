import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Records a student's own self-assessment against the answer key (never
// touches submissions/feedback/grade_history — this is not a teacher-verified
// grade). Marking a self-test attempt incorrect/partial auto-flags the
// question into the student's review folder.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { questionId, testId, selfGrade } = await req.json() as {
    questionId: string; testId?: string | null; selfGrade: 'correct' | 'partial' | 'incorrect'
  }
  if (!questionId || !selfGrade) return NextResponse.json({ error: 'Missing questionId or selfGrade' }, { status: 400 })

  const admin = await createAdminClient()

  const { error } = await admin.from('practice_attempts').insert({
    student_id: caller.user.id,
    question_id: questionId,
    test_id: testId || null,
    self_grade: selfGrade,
  })
  if (error) {
    console.error('self-grade insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (selfGrade !== 'correct') {
    const { error: flagErr } = await admin.from('review_flags')
      .upsert({ student_id: caller.user.id, question_id: questionId, source: 'auto' }, { onConflict: 'student_id,question_id', ignoreDuplicates: true })
    if (flagErr) console.error('self-grade auto-flag error:', flagErr)
  }

  return NextResponse.json({ ok: true })
}
