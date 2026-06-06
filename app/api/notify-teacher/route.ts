import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { studentId, questionId, studentName, message } = await req.json()
  if (!studentId || !questionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
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
      read: false,
    })
    .select('id, type, student_id, question_id, class_id, created_at, read')
    .single()

  if (error) {
    console.error('notify-teacher error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, notification: { ...data, student_name: studentName, question_title: message } })
}
