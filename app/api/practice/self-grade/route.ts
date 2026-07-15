import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Records a student's own self-assessment against the answer key (never
// touches submissions/feedback/grade_history — this is not a teacher-verified
// grade). Marking a self-test attempt incorrect auto-flags the question into
// the student's review folder.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { questionId, testId, selfGrade, canvasData } = await req.json() as {
    questionId: string; testId?: string | null; selfGrade: 'correct' | 'incorrect'; canvasData?: string | null
  }
  if (!questionId || !selfGrade) return NextResponse.json({ error: 'Missing questionId or selfGrade' }, { status: 400 })

  const admin = await createAdminClient()

  // finish-test already inserted a row with this question's canvas work and
  // a null self_grade — fill that in instead of inserting a duplicate row.
  let updatedExisting = false
  if (testId) {
    const { data: updated } = await admin.from('practice_attempts')
      .update({ self_grade: selfGrade, ...(canvasData ? { canvas_data: canvasData } : {}) })
      .eq('student_id', caller.user.id).eq('question_id', questionId).eq('test_id', testId).is('self_grade', null)
      .select('id')
    updatedExisting = !!updated && updated.length > 0
  }

  if (!updatedExisting) {
    const { error } = await admin.from('practice_attempts').insert({
      student_id: caller.user.id,
      question_id: questionId,
      test_id: testId || null,
      self_grade: selfGrade,
      canvas_data: canvasData || null,
    })
    if (error) {
      console.error('self-grade insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  if (selfGrade !== 'correct') {
    const { error: flagErr } = await admin.from('review_flags')
      .upsert({ student_id: caller.user.id, question_id: questionId, source: 'auto' }, { onConflict: 'student_id,question_id', ignoreDuplicates: true })
    if (flagErr) console.error('self-grade auto-flag error:', flagErr)
  }

  return NextResponse.json({ ok: true })
}
