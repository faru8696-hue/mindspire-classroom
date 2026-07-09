import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId, questionId, studentName, message } = await req.json()
  if (!studentId || !questionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // A student may only notify the teacher about their own work.
  if (caller.profile?.role !== 'teacher' && caller.user.id !== studentId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Look up classId via question → topic → unit → class
  const { data: question } = await admin
    .from('questions')
    .select('id, topic_id, topics(unit_id, units(class_id))')
    .eq('id', questionId)
    .single()

  const topic = Array.isArray(question?.topics) ? question.topics[0] : question?.topics
  const unit = Array.isArray(topic?.units) ? topic.units[0] : topic?.units
  const classId = unit?.class_id

  if (!classId) {
    return NextResponse.json({ error: 'Could not resolve class' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('notifications')
    .insert({
      type: 'comment',
      student_id: studentId,
      question_id: questionId,
      class_id: classId,
      message: message || null,
      read: false,
    })
    .select('id, type, student_id, question_id, class_id, created_at, read, message')
    .single()

  if (error) {
    console.error('notify-teacher error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, notification: { ...data, student_name: studentName } })
}
