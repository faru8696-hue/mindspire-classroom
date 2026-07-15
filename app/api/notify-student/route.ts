import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse, after } from 'next/server'
import { getCaller } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

function commentEmailHtml(studentFirstName: string, questionTitle: string, message: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; color:#111827;">
      <p>Hi ${studentFirstName},</p>
      <p>Your teacher left a comment on <strong>${questionTitle}</strong>:</p>
      <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px 16px; margin-top:10px; font-size:14px; white-space:pre-wrap;">${message}</div>
      <p style="color:#9ca3af; font-size:12px; margin-top:20px;">Log in to Mindspire Lab Classroom to reply.</p>
    </div>
  `
}

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId, questionId, grade, feedback, type } = await req.json()
  if (!studentId || !questionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin
    .from('student_notifications')
    .insert({ student_id: studentId, question_id: questionId, grade: grade || null, feedback: feedback || null, type: type || 'grade', read: false })
    .select()

  if (error) {
    console.error('notify-student error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Best-effort email alongside the in-app notification — the comment
  // thread's toast/badge is easy to miss between sessions, so a teacher
  // comment (type 'comment', from the per-question Comments thread) should
  // also reach the student's inbox. Scheduled via after() so this endpoint
  // responds immediately instead of the caller waiting on Resend.
  if ((type || 'grade') === 'comment' && feedback) {
    after(async () => {
      try {
        const [{ data: student }, { data: question }] = await Promise.all([
          admin.from('profiles').select('full_name, nickname, email').eq('id', studentId).maybeSingle(),
          admin.from('questions').select('title').eq('id', questionId).maybeSingle(),
        ])
        if (student?.email) {
          const firstName = (student.nickname || student.full_name || 'there').split(' ')[0]
          await sendEmail({
            to: student.email,
            subject: `New comment on ${question?.title ?? 'your work'}`,
            html: commentEmailHtml(firstName, question?.title ?? 'your question', feedback),
          })
        }
      } catch (err) {
        console.error('notify-student: comment email failed:', err)
      }
    })
  }

  return NextResponse.json({ ok: true, data })
}
