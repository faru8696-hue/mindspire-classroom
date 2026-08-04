import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const GRADE_STYLE: Record<string, { icon: string; bg: string; label: string }> = {
  correct:   { icon: '✅', bg: 'border-green-400 bg-green-50',   label: 'Correct!' },
  partial:   { icon: '🟡', bg: 'border-amber-400 bg-amber-50',   label: 'Partially correct' },
  discussed: { icon: '💬', bg: 'border-blue-400 bg-blue-50',     label: 'Discussed' },
  incorrect: { icon: '❌', bg: 'border-red-400 bg-red-50',       label: 'Incorrect' },
  needsmore: { icon: '🔄', bg: 'border-purple-400 bg-purple-50', label: 'Needs more work' },
}

interface Row {
  id: string
  icon: string
  bg: string
  title: string
  subtitle: string
  classTitle: string | null
  href: string
  createdAt: string
  read: boolean
}

export default async function StudentNotificationsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const admin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: rawNotifs } = await admin
    .from('student_notifications')
    .select('id, type, grade, feedback, assignment_count, read, created_at, question_id')
    .eq('student_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Resolve question → topic → unit → class with flat lookups instead of one
  // deep nested embed — that embed errors with a PostgREST 42803 ("must
  // appear in GROUP BY") for this schema's relationship graph, which was
  // silently returning zero notifications on this whole page.
  const questionIds = [...new Set((rawNotifs ?? []).map(n => n.question_id).filter(Boolean))]
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

  // "New assignment" pings are the noisiest type — a teacher adding several
  // questions to one topic used to show as one row per question (or per
  // notify-assignment's own 2h batching window, so a slower drip-feed of
  // adds still produced several rows). Rolled up here by topic instead: one
  // "Topic — N questions assigned" row regardless of how many separate
  // pings created it, so a busy topic doesn't crowd out everything else in
  // the list.
  const assignmentGroups = new Map<string, {
    count: number; latestCreatedAt: string; anyUnread: boolean; topicTitle: string; classTitle: string | null; href: string
  }>()
  const rows: Row[] = []

  for (const n of rawNotifs ?? []) {
    const q = questionById.get(n.question_id)
    const topic = q ? topicById.get(q.topic_id) : undefined
    const unit = topic ? unitById.get(topic.unit_id) : undefined
    const cls = unit ? classById.get(unit.class_id) : undefined
    const href = cls?.id && unit?.id && topic?.id && q?.id
      ? `/student/${cls.id}/${unit.id}/${topic.id}/${q.id}`
      : '/student/assignments'

    if (n.type === 'assignment' && topic?.id) {
      const topicHref = cls?.id && unit?.id ? `/student/${cls.id}/${unit.id}/${topic.id}` : href
      const g = assignmentGroups.get(topic.id) ?? {
        count: 0, latestCreatedAt: n.created_at, anyUnread: false,
        topicTitle: topic.title, classTitle: cls?.title ?? null, href: topicHref,
      }
      g.count += n.assignment_count ?? 1
      g.anyUnread = g.anyUnread || !n.read
      if (n.created_at > g.latestCreatedAt) g.latestCreatedAt = n.created_at
      assignmentGroups.set(topic.id, g)
      continue
    }

    const isComment = n.type === 'comment'
    const isKeyReleased = n.type === 'answer_key_released'
    const style = isComment
      ? { icon: '💬', bg: 'border-blue-400 bg-blue-50', label: 'Teacher left a comment' }
      : isKeyReleased
      ? { icon: '🔓', bg: 'border-purple-400 bg-purple-50', label: 'Answer key released' }
      : GRADE_STYLE[n.grade ?? ''] ?? { icon: '📝', bg: 'border-gray-300 bg-gray-50', label: 'Update' }
    rows.push({
      id: n.id,
      icon: style.icon,
      bg: style.bg,
      title: q?.title ?? 'Question',
      subtitle: `${style.label}${n.feedback ? ` — ${n.feedback}` : ''}`,
      classTitle: cls?.title ?? null,
      href,
      createdAt: n.created_at,
      read: n.read,
    })
  }

  for (const g of assignmentGroups.values()) {
    rows.push({
      id: `assignment-group:${g.topicTitle}:${g.latestCreatedAt}`,
      icon: '📋',
      bg: 'border-purple-400 bg-purple-50',
      title: g.topicTitle,
      subtitle: `${g.count} question${g.count === 1 ? '' : 's'} assigned`,
      classTitle: g.classTitle,
      href: g.href,
      createdAt: g.latestCreatedAt,
      read: !g.anyUnread,
    })
  }

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">🔔 Notifications</h1>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">No notifications yet. Your teacher will send feedback here when they grade your work.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => {
            const mins = Math.round((Date.now() - new Date(row.createdAt).getTime()) / 60000)
            const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`
            return (
              <Link key={row.id} href={row.href} className={`flex items-center gap-4 border-l-4 rounded-xl px-5 py-4 hover:opacity-80 transition-opacity ${row.bg} ${!row.read ? 'ring-2 ring-purple-300' : ''}`}>
                <span className="text-2xl flex-shrink-0">{row.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{row.title}</p>
                  <p className="text-sm text-gray-600 truncate">{row.subtitle}</p>
                  {row.classTitle && <p className="text-xs text-gray-400 mt-0.5">{row.classTitle}</p>}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
