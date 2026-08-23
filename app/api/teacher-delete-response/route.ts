import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: permanently removes ONE student response from School
// Topics data — a single checked topic, the "hasn't started" flag (+ its
// start date), or an "other topics" note. Separate from the group on/off
// toggle (set-group-student), which hides data from planning without
// deleting it. Neither student_topic_plans nor student_school_status grant
// teachers write access via RLS (select-only), so this goes through the
// service-role admin client.
type Body =
  | { type: 'topic'; studentId: string; topicId: string }
  | { type: 'not_started'; studentId: string; classId: string }
  | { type: 'other_topics'; studentId: string; classId: string }

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json() as Body
  const admin = await createAdminClient()

  if (body.type === 'topic') {
    if (!body.studentId || !body.topicId) return NextResponse.json({ error: 'Missing studentId or topicId' }, { status: 400 })
    const { error } = await admin.from('student_topic_plans')
      .delete().eq('student_id', body.studentId).eq('topic_id', body.topicId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.type === 'not_started') {
    if (!body.studentId || !body.classId) return NextResponse.json({ error: 'Missing studentId or classId' }, { status: 400 })
    const { error } = await admin.from('student_school_status')
      .update({ not_started: false, starts_on: null }).eq('student_id', body.studentId).eq('class_id', body.classId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.type === 'other_topics') {
    if (!body.studentId || !body.classId) return NextResponse.json({ error: 'Missing studentId or classId' }, { status: 400 })
    const { error } = await admin.from('student_school_status')
      .update({ other_topics: null }).eq('student_id', body.studentId).eq('class_id', body.classId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
