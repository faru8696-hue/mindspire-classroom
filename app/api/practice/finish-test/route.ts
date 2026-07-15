import { NextRequest, NextResponse, after } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

function teacherAlertHtml(studentName: string, testTitle: string, className: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; color:#111827;">
      <p><strong>${studentName}</strong> just finished a self-study test in <strong>${className}</strong>.</p>
      <p style="color:#6b7280; font-size:14px;">${testTitle}</p>
      <p style="color:#9ca3af; font-size:12px; margin-top:20px;">Log in to Mindspire Lab Classroom → Self Study to see the questions and their answers.</p>
    </div>
  `
}

// Called once when a student clicks "Finish Test" (attempt phase -> review
// phase): grades every MCQ answer they picked during the attempt (software
// grading — correctness is never revealed until this point, matching the
// "everything at the end" self-study flow) and notifies the teacher that a
// test was completed. FRQ self-grading still happens per-question in the
// review phase that follows (via /api/practice/self-grade) since only the
// student can judge their own handwritten work against the answer key.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { testId, mcqAnswers } = await req.json() as {
    testId: string
    mcqAnswers: { questionId: string; selectedIndex: number }[]
  }
  if (!testId) return NextResponse.json({ error: 'Missing testId' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: test } = await admin
    .from('practice_tests')
    .select('id, student_id, class_id, title')
    .eq('id', testId)
    .maybeSingle()
  if (!test || test.student_id !== caller.user.id) return NextResponse.json({ error: 'Test not found' }, { status: 404 })

  const mcqQuestionIds = (mcqAnswers ?? []).map(a => a.questionId)
  const { data: mcqQuestions } = mcqQuestionIds.length > 0
    ? await admin.from('questions').select('id, mcq_correct_index').in('id', mcqQuestionIds)
    : { data: [] as { id: string; mcq_correct_index: number | null }[] }
  const correctIndexByQuestion = new Map((mcqQuestions ?? []).map(q => [q.id, q.mcq_correct_index]))

  const results: { questionId: string; correct: boolean; correctIndex: number | null }[] = []
  for (const a of mcqAnswers ?? []) {
    const correctIndex = correctIndexByQuestion.get(a.questionId) ?? null
    const isCorrect = correctIndex !== null && a.selectedIndex === correctIndex
    results.push({ questionId: a.questionId, correct: isCorrect, correctIndex })

    await admin.from('practice_attempts').insert({
      student_id: caller.user.id,
      question_id: a.questionId,
      test_id: testId,
      self_grade: isCorrect ? 'correct' : 'incorrect',
      mcq_selected_index: a.selectedIndex,
    })
    if (!isCorrect) {
      await admin.from('review_flags')
        .upsert({ student_id: caller.user.id, question_id: a.questionId, source: 'auto' }, { onConflict: 'student_id,question_id', ignoreDuplicates: true })
    }
  }

  await admin.from('practice_test_notifications').insert({
    test_id: testId, student_id: caller.user.id, class_id: test.class_id,
  })

  after(async () => {
    try {
      const [{ data: student }, { data: cls }, { data: teachers }] = await Promise.all([
        admin.from('profiles').select('full_name, nickname').eq('id', caller.user.id).maybeSingle(),
        admin.from('classes').select('title').eq('id', test.class_id).maybeSingle(),
        admin.from('profiles').select('email').eq('role', 'teacher').eq('approved', true),
      ])
      const studentName = student?.nickname || student?.full_name || 'A student'
      for (const t of teachers ?? []) {
        if (!t.email) continue
        await sendEmail({
          to: t.email,
          subject: `${studentName} finished a self-study test`,
          html: teacherAlertHtml(studentName, test.title, cls?.title ?? 'a class'),
        })
      }
    } catch (err) {
      console.error('finish-test: teacher email failed:', err)
    }
  })

  return NextResponse.json({ ok: true, results })
}
