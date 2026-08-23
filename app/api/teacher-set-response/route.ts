import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: lets the teacher add/update ONE response on a student's
// behalf — a checked topic (+ test date), the "hasn't started" flag (+
// start date), or an "other topics" note. Mirrors what a student can
// already do for themselves on the School Topics page, for cases like a
// student who reported verbally instead of using the page. Upsert only
// touches the columns provided, so setting one field never clobbers
// another already on the same student_school_status row. Same RLS
// reasoning as teacher-delete-response: neither table grants teachers
// write access directly.
type Body =
  | { type: 'topic'; studentId: string; classId: string; topicId: string; testDate: string | null }
  | { type: 'not_started'; studentId: string; classId: string; startsOn: string | null }
  | { type: 'other_topics'; studentId: string; classId: string; text: string }

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json() as Body
  const admin = await createAdminClient()

  if (body.type === 'topic') {
    if (!body.studentId || !body.classId || !body.topicId) {
      return NextResponse.json({ error: 'Missing studentId, classId, or topicId' }, { status: 400 })
    }
    const { error } = await admin.from('student_topic_plans')
      .upsert(
        { student_id: body.studentId, class_id: body.classId, topic_id: body.topicId, test_date: body.testDate || null },
        { onConflict: 'student_id,topic_id' },
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.type === 'not_started') {
    if (!body.studentId || !body.classId) return NextResponse.json({ error: 'Missing studentId or classId' }, { status: 400 })
    const { error } = await admin.from('student_school_status')
      .upsert(
        { student_id: body.studentId, class_id: body.classId, not_started: true, starts_on: body.startsOn || null },
        { onConflict: 'student_id,class_id' },
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.type === 'other_topics') {
    if (!body.studentId || !body.classId || !body.text.trim()) {
      return NextResponse.json({ error: 'Missing studentId, classId, or text' }, { status: 400 })
    }
    const { error } = await admin.from('student_school_status')
      .upsert(
        { student_id: body.studentId, class_id: body.classId, other_topics: body.text.trim() },
        { onConflict: 'student_id,class_id' },
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
