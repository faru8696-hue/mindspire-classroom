import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Returns the caller's own notifications. The student_notifications table is
// RLS-gated so the browser client can't read it directly — this service-role
// route returns the rows for the authenticated student only.
export async function GET() {
  const caller = await getCaller()
  if (!caller?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data } = await admin
    .from('student_notifications')
    .select('id, type, grade, feedback, count, read, created_at, question_id, questions(id, title, topic_id, topics(id, unit_id, units(id, class_id, classes(id, title))))')
    .eq('student_id', caller.user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifications = (data ?? []).map((n: any) => {
    const q = Array.isArray(n.questions) ? n.questions[0] : n.questions
    const topic = Array.isArray(q?.topics) ? q.topics[0] : q?.topics
    const unit = Array.isArray(topic?.units) ? topic.units[0] : topic?.units
    const cls = Array.isArray(unit?.classes) ? unit.classes[0] : unit?.classes
    const href = cls?.id && unit?.id && topic?.id && q?.id
      ? `/student/${cls.id}/${unit.id}/${topic.id}/${q.id}`
      : '/student/assignments'
    return {
      id: n.id,
      type: n.type,
      grade: n.grade,
      feedback: n.feedback,
      count: n.count,
      read: n.read,
      created_at: n.created_at,
      question_id: n.question_id,
      question_title: q?.title ?? 'Question',
      class_title: cls?.title ?? null,
      href,
    }
  })

  return NextResponse.json({ notifications })
}

// Marks the caller's own notifications as read.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { ids } = await req.json()
  if (!ids?.length) return NextResponse.json({ ok: true })
  await admin
    .from('student_notifications')
    .update({ read: true })
    .eq('student_id', caller.user.id)
    .in('id', ids)
  return NextResponse.json({ ok: true })
}
