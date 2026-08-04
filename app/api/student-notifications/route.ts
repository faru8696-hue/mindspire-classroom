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
    ? await admin.from('topics').select('id, title, unit_id').in('id', topicIds)
    : { data: [] as { id: string; title: string; unit_id: string }[] }

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

  const resolved = (data ?? []).map(n => {
    const q = questionById.get(n.question_id)
    const topic = q ? topicById.get(q.topic_id) : undefined
    const unit = topic ? unitById.get(topic.unit_id) : undefined
    const cls = unit ? classById.get(unit.class_id) : undefined
    const href = cls?.id && unit?.id && topic?.id && q?.id
      ? `/student/${cls.id}/${unit.id}/${topic.id}/${q.id}`
      : '/student/assignments'
    const topicHref = cls?.id && unit?.id && topic?.id
      ? `/student/${cls.id}/${unit.id}/${topic.id}`
      : href
    return {
      id: n.id,
      type: n.type,
      grade: n.grade,
      feedback: n.feedback,
      count: n.assignment_count,
      read: n.read,
      created_at: n.created_at,
      question_id: n.question_id,
      question_title: n.type === 'reminder' ? 'Reminder from your teacher' : (q?.title ?? 'Question'),
      class_title: cls?.title ?? null,
      topic_id: topic?.id ?? null,
      topic_title: topic?.title ?? null,
      href,
      topic_href: topicHref,
    }
  })

  // "New assignment" pings are the noisiest type — a teacher adding 5
  // questions to one topic used to show as up to 5 separate rows (or one
  // row if they all landed within the same 2h batching window in
  // notify-assignment, but a slower drip-feed of individual adds still
  // produced one row each). Rolled up here by topic instead, so the
  // student sees "Length — 7 questions assigned" once rather than the
  // topic crowding out every other notification in a short list.
  const assignmentGroups = new Map<string, {
    count: number; latestCreatedAt: string; anyUnread: boolean; topicTitle: string; classTitle: string | null; href: string
  }>()
  const notifications: typeof resolved = []
  for (const n of resolved) {
    if (n.type === 'assignment' && n.topic_id) {
      const g = assignmentGroups.get(n.topic_id) ?? {
        count: 0, latestCreatedAt: n.created_at, anyUnread: false,
        topicTitle: n.topic_title ?? 'a topic', classTitle: n.class_title, href: n.topic_href,
      }
      g.count += n.count ?? 1
      g.anyUnread = g.anyUnread || !n.read
      if (n.created_at > g.latestCreatedAt) g.latestCreatedAt = n.created_at
      assignmentGroups.set(n.topic_id, g)
    } else {
      notifications.push(n)
    }
  }
  for (const [topicId, g] of assignmentGroups) {
    notifications.push({
      id: `assignment-group:${topicId}`,
      type: 'assignment',
      grade: null,
      feedback: `${g.count} question${g.count === 1 ? '' : 's'} assigned`,
      count: g.count,
      read: !g.anyUnread,
      created_at: g.latestCreatedAt,
      question_id: null,
      question_title: g.topicTitle,
      class_title: g.classTitle,
      topic_id: topicId,
      topic_title: g.topicTitle,
      href: g.href,
      topic_href: g.href,
    })
  }
  notifications.sort((a, b) => b.created_at.localeCompare(a.created_at))

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
