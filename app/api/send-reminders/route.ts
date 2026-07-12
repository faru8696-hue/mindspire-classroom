import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { buildClassDigests } from '@/lib/reminders'

function digestHtml(studentName: string, className: string, digest: { subtopics: { topicTitle: string; unitTitle: string; remaining: number }[]; dueSoon: { questionTitle: string; dueDate: string }[] }): string {
  const subtopicRows = digest.subtopics
    .map(s => `<li><strong>${s.topicTitle}</strong>${s.unitTitle ? ` (${s.unitTitle})` : ''} — ${s.remaining} question${s.remaining > 1 ? 's' : ''} remaining</li>`)
    .join('')
  const dueRows = digest.dueSoon
    .map(d => `<li>${d.questionTitle} — due ${new Date(d.dueDate).toLocaleDateString()}</li>`)
    .join('')

  return `
    <div style="font-family: sans-serif; max-width: 480px;">
      <p>Hi ${studentName},</p>
      <p>Here's a quick reminder of what's left in <strong>${className}</strong>:</p>
      ${subtopicRows ? `<p><strong>Subtopics with unfinished questions:</strong></p><ul>${subtopicRows}</ul>` : ''}
      ${dueRows ? `<p><strong>Due soon:</strong></p><ul>${dueRows}</ul>` : ''}
      <p style="color:#888; font-size: 12px;">— Mindspire Lab Classroom</p>
    </div>
  `
}

// Teacher-only: sends reminder emails to a class's students.
// type "digest": one email per student summarizing unfinished SUBTOPICS
//   (not individual questions) and anything due soon — skipped entirely
//   for a student with nothing pending.
// type "today": a simple "class is today" ping to every enrolled student,
//   no computation, optional custom message.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { classId, type, message } = await req.json()
  if (!classId || !type) {
    return NextResponse.json({ error: 'Missing classId or type' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: cls } = await admin.from('classes').select('title').eq('id', classId).single()
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  let sent = 0, skipped = 0, failed = 0
  const errors: string[] = []

  try {
    if (type === 'today') {
      const { data: enrollments } = await admin.from('class_enrollments').select('student_id').eq('class_id', classId)
      const studentIds = (enrollments ?? []).map(e => e.student_id)
      const { data: students } = studentIds.length > 0
        ? await admin.from('profiles').select('id, full_name, email').in('id', studentIds).eq('role', 'student').eq('approved', true)
        : { data: [] as { id: string; full_name: string; email: string | null }[] }

      for (const s of students ?? []) {
        if (!s.email) { skipped++; continue }
        try {
          await sendEmail({
            to: s.email,
            subject: `Reminder: ${cls.title} today`,
            html: `<div style="font-family: sans-serif;"><p>Hi ${s.full_name},</p><p>Just a reminder — <strong>${cls.title}</strong> is today.</p>${message ? `<p>${message}</p>` : ''}<p style="color:#888; font-size: 12px;">— Mindspire Lab Classroom</p></div>`,
          })
          sent++
        } catch (err) {
          failed++
          errors.push(err instanceof Error ? err.message : String(err))
        }
      }
    } else if (type === 'digest') {
      const digests = await buildClassDigests(classId)
      for (const d of digests) {
        if (d.subtopics.length === 0 && d.dueSoon.length === 0) { skipped++; continue }
        if (!d.email) { skipped++; continue }
        try {
          await sendEmail({
            to: d.email,
            subject: `${cls.title}: what's left this week`,
            html: digestHtml(d.studentName, cls.title, d),
          })
          sent++
        } catch (err) {
          failed++
          errors.push(err instanceof Error ? err.message : String(err))
        }
      }
    } else {
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }

  return NextResponse.json({ sent, skipped, failed, errors: errors.slice(0, 3) })
}
