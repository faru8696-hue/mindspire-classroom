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

export default async function StudentNotificationsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const admin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: notifs } = await admin
    .from('student_notifications')
    .select('id, type, grade, feedback, count, read, created_at, question_id, questions(id, title, topic_id, topics(id, unit_id, units(id, class_id, classes(id, title))))')
    .eq('student_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">🔔 Notifications</h1>

      {!notifs?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">No notifications yet. Your teacher will send feedback here when they grade your work.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(notifs as any[]).map(n => {
            const q = Array.isArray(n.questions) ? n.questions[0] : n.questions
            const topic = Array.isArray(q?.topics) ? q.topics[0] : q?.topics
            const unit = Array.isArray(topic?.units) ? topic.units[0] : topic?.units
            const cls = Array.isArray(unit?.classes) ? unit.classes[0] : unit?.classes
            const isAssignment = n.type === 'assignment'
            const isComment = n.type === 'comment'
            const style = isAssignment
              ? { icon: '📋', bg: 'border-purple-400 bg-purple-50', label: n.count && n.count > 1 ? `${n.count} new questions assigned` : 'New question assigned' }
              : isComment
              ? { icon: '💬', bg: 'border-blue-400 bg-blue-50', label: 'Teacher left a comment' }
              : GRADE_STYLE[n.grade] ?? { icon: '📝', bg: 'border-gray-300 bg-gray-50', label: 'Update' }
            const href = cls?.id && unit?.id && topic?.id && q?.id
              ? `/student/${cls.id}/${unit.id}/${topic.id}/${q.id}`
              : '/student/assignments'
            const mins = Math.round((Date.now() - new Date(n.created_at).getTime()) / 60000)
            const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`
            return (
              <Link key={n.id} href={href} className={`flex items-center gap-4 border-l-4 rounded-xl px-5 py-4 hover:opacity-80 transition-opacity ${style.bg} ${!n.read ? 'ring-2 ring-purple-300' : ''}`}>
                <span className="text-2xl flex-shrink-0">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  {isAssignment ? (
                    <>
                      <p className="font-semibold text-gray-800 truncate">{style.label}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {n.count && n.count > 1 ? `Latest: ${q?.title ?? 'Question'}` : (q?.title ?? 'Question')}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-800 truncate">{q?.title ?? 'Question'}</p>
                      <p className="text-sm text-gray-600 truncate">{style.label}{n.feedback ? ` — ${n.feedback}` : ''}</p>
                    </>
                  )}
                  {cls?.title && <p className="text-xs text-gray-400 mt-0.5">{cls.title}</p>}
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
