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

  const { data, error } = await admin
    .from('student_notifications')
    .select('id, type, grade, feedback, assignment_count, read, created_at, question_id')
    .eq('student_id', caller.user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('student-notifications fetch error:', error)
    return NextResponse.json({ notifications: [] })
  }

  // Resolve question → topic → unit → class with flat lookups instead of one
  // deep nested embed (questions→topics→units→classes) — that embed was
  // erroring with a PostgREST 42803 ("must appear in GROUP BY") for reasons
  // specific to this schema's relationship graph, which silently returned a
  // 400 for every request. Since the bell's fetch just gives up on !res.ok,
  // this meant students never saw ANY notification (grade or comment).
  const questionIds = [...new Set((data ?? []).map(n => n.question_id).filter(Boolean))]
  const { data: qRows } = questionIds.length > 0
    ? await admin.from('questions').select('id, title, topic_id').in('id', questionIds)
    : { data: [] as { id: string; title: string; topic_id: string }[] }

  const topicIds = [...new Set((qRows ?? []).map(q => q.topic_id).filter(Boolean))]
  const { data: tRows } = topicIds.length > 0
    ? await admin.from('topics').select('id, unit_id').in('id', topicIds)
    : { data: [] as { id: string; unit_id: string }[] }

  const unitIds = [...new Set((tRows ?? []).map(t => t.unit_id).filter(Boolean))]
  const { data: uRows } = unitIds.length > 0
    ? await admin.from('units').select('id, class_id').in('id', unitIds)
    : { data: [] as { id: string; class_id: string }[] }

  const classIds = [...new Set((uRows ?? []).map(u => u.class_id).filter(Boolean))]
  const { data: cRows } = classIds.length > 0
    ? await admin.from('classes').select('id, title').in('id', classIds)
    : { data: [] as { id: string; title: string }[] }

  const questionById = new Map((qRows ?? []).map(q => [q.id, q]))
  const topicById = new Map((tRows ?? []).map(t => [t.id, t]))
  const unitById = new Map((uRows ?? []).map(u => [u.id, u]))
  const classById = new Map((cRows ?? []).map(c => [c.id, c]))

  const notifications = (data ?? []).map(n => {
    const q = questionById.get(n.question_id)
    const topic = q ? topicById.get(q.topic_id) : undefined
    const unit = topic ? unitById.get(topic.unit_id) : undefined
    const cls = unit ? classById.get(unit.class_id) : undefined
    const href = cls?.id && unit?.id && topic?.id && q?.id
      ? `/student/${cls.id}/${unit.id}/${topic.id}/${q.id}`
      : '/student/assignments'
    return {
      id: n.id,
      type: n.type,
      grade: n.grade,
      feedback: n.feedback,
      count: n.assignment_count,
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
