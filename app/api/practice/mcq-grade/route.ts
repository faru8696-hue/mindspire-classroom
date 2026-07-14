import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Software grading for MCQ self-study questions — the correct index is
// looked up server-side (never trust a client-sent "is this right" flag),
// compared to what the student picked, and logged the same way a self-graded
// FRQ attempt is (practice_attempts + auto-flag on incorrect).
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { questionId, testId, selectedIndex } = await req.json() as {
    questionId: string; testId?: string | null; selectedIndex: number
  }
  if (!questionId || typeof selectedIndex !== 'number') {
    return NextResponse.json({ error: 'Missing questionId or selectedIndex' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: question } = await admin
    .from('questions')
    .select('mcq_correct_index, question_type')
    .eq('id', questionId)
    .maybeSingle()
  if (!question || question.question_type !== 'mcq' || question.mcq_correct_index === null) {
    return NextResponse.json({ error: 'Not a valid MCQ question' }, { status: 400 })
  }

  const isCorrect = selectedIndex === question.mcq_correct_index
  const grade = isCorrect ? 'correct' : 'incorrect'

  const { error } = await admin.from('practice_attempts').insert({
    student_id: caller.user.id,
    question_id: questionId,
    test_id: testId || null,
    self_grade: grade,
  })
  if (error) console.error('mcq-grade attempt insert error:', error)

  if (!isCorrect) {
    const { error: flagErr } = await admin.from('review_flags')
      .upsert({ student_id: caller.user.id, question_id: questionId, source: 'auto' }, { onConflict: 'student_id,question_id', ignoreDuplicates: true })
    if (flagErr) console.error('mcq-grade auto-flag error:', flagErr)
  }

  return NextResponse.json({ correct: isCorrect, correctIndex: question.mcq_correct_index })
}
