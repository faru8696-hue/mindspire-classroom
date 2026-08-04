import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Free-text notification with no question attached — "study for the test
// Friday," "great job this week," anything. Reuses student_notifications
// (already the backing store for grade/comment/assignment pings) with a
// new 'reminder' type, question_id left null since it isn't tied to one.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { classId, studentIds: pickedStudentIds, message } = await req.json() as {
    classId?: string
    studentIds?: string[]
    message?: string
  }
  const trimmed = message?.trim()
  if (!trimmed) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Resolve the target student list: one or more specific students,
  // everyone in one class, or everyone enrolled anywhere (neither given).
  let studentIds: string[]
  if (pickedStudentIds && pickedStudentIds.length > 0) {
    studentIds = [...new Set(pickedStudentIds)]
  } else if (classId) {
    const { data: enrollments } = await admin.from('class_enrollments').select('student_id').eq('class_id', classId)
    studentIds = [...new Set((enrollments ?? []).map(e => e.student_id))]
  } else {
    const { data: enrollments } = await admin.from('class_enrollments').select('student_id')
    studentIds = [...new Set((enrollments ?? []).map(e => e.student_id))]
  }

  if (studentIds.length === 0) {
    return NextResponse.json({ error: 'No students match that target.' }, { status: 400 })
  }

  const { error } = await admin.from('student_notifications').insert(
    studentIds.map(sid => ({
      student_id: sid,
      question_id: null,
      type: 'reminder',
      grade: null,
      feedback: trimmed,
      read: false,
    }))
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, sentCount: studentIds.length })
}
