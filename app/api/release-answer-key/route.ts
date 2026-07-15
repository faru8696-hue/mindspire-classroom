import { NextRequest, NextResponse, after } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

function releaseEmailHtml(studentFirstName: string, questionTitle: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; color:#111827;">
      <p>Hi ${studentFirstName},</p>
      <p>Your teacher just released the answer key for <strong>${questionTitle}</strong> to you.</p>
      <p style="color:#9ca3af; font-size:12px; margin-top:20px;">Log in to Mindspire Lab Classroom to view it on the question page.</p>
    </div>
  `
}

// Teacher-only toggle: grants (or revokes) one specific student's access to
// one specific question's answer key. Deliberately per-student, not
// per-class — releasing it to one student who's been stuck shouldn't hand
// the whole class the answer.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId, questionId, released } = await req.json() as { studentId: string; questionId: string; released: boolean }
  if (!studentId || !questionId || typeof released !== 'boolean') {
    return NextResponse.json({ error: 'Missing studentId, questionId, or released' }, { status: 400 })
  }

  const admin = await createAdminClient()

  if (released) {
    const { error } = await admin.from('answer_key_releases')
      .upsert({ teacher_id: caller.user.id, student_id: studentId, question_id: questionId }, { onConflict: 'student_id,question_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify the student in-app and by email — releasing the key is only
    // useful if they actually know it happened, same pattern as grade/
    // comment notifications elsewhere in this app.
    const [{ data: student }, { data: question }] = await Promise.all([
      admin.from('profiles').select('full_name, nickname, email').eq('id', studentId).maybeSingle(),
      admin.from('questions').select('title').eq('id', questionId).maybeSingle(),
    ])

    await admin.from('student_notifications').insert({
      student_id: studentId,
      question_id: questionId,
      grade: null,
      feedback: 'You can view it on the question page now.',
      type: 'answer_key_released',
      read: false,
    })

    if (student?.email) {
      const firstName = (student.nickname || student.full_name || 'there').split(' ')[0]
      after(async () => {
        try {
          await sendEmail({
            to: student.email!,
            subject: `Answer key released: ${question?.title ?? 'your question'}`,
            html: releaseEmailHtml(firstName, question?.title ?? 'your question'),
          })
        } catch (err) {
          console.error('release-answer-key: email failed:', err)
        }
      })
    }
  } else {
    const { error } = await admin.from('answer_key_releases')
      .delete()
      .eq('student_id', studentId)
      .eq('question_id', questionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
