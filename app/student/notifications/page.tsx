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
  const studentId = session.user.id

  const admin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Get all submissions for this student with feedback
  const { data: subs } = await admin
    .from('submissions')
    .select('id, question_id, updated_at, questions(id, title, topic_id, topics(id, title, unit_id, units(id, title, class_id, classes(id, title))))')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })

  const subIds = (subs ?? []).map(s => s.id)
  const { data: feedbacks } = subIds.length > 0
    ? await admin.from('feedback').select('submission_id, grade, text_feedback, created_at').in('submission_id', subIds).not('grade', 'is', null).order('created_at', { ascending: false })
    : { data: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (feedbacks ?? []).map((f: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = (subs ?? []).find((s: any) => s.id === f.submission_id) as any
    const q = Array.isArray(sub?.questions) ? sub.questions[0] : sub?.questions
    const topic = Array.isArray(q?.topics) ? q.topics[0] : q?.topics
    const unit = Array.isArray(topic?.units) ? topic.units[0] : topic?.units
    const cls = Array.isArray(unit?.classes) ? unit.classes[0] : unit?.classes
    return {
      id: f.submission_id,
      grade: f.grade as string,
      feedback: f.text_feedback as string | null,
      created_at: f.created_at as string,
      question_title: q?.title ?? 'Question',
      question_id: q?.id ?? '',
      topic_id: topic?.id ?? '',
      unit_id: unit?.id ?? '',
      class_id: cls?.id ?? '',
      class_title: cls?.title ?? '',
    }
  })

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">🔔 My Notifications</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">No feedback yet. Submit your work and your teacher will grade it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const style = GRADE_STYLE[item.grade] ?? { icon: '📝', bg: 'border-gray-300 bg-gray-50', label: item.grade }
            const href = item.class_id && item.unit_id && item.topic_id && item.question_id
              ? `/student/${item.class_id}/${item.unit_id}/${item.topic_id}/${item.question_id}`
              : '/student/assignments'
            const timeAgo = (() => {
              const mins = Math.round((Date.now() - new Date(item.created_at).getTime()) / 60000)
              if (mins < 60) return `${mins}m ago`
              if (mins < 1440) return `${Math.round(mins / 60)}h ago`
              return `${Math.round(mins / 1440)}d ago`
            })()
            return (
              <Link
                key={item.id}
                href={href}
                className={`flex items-center gap-4 border-l-4 rounded-xl px-5 py-4 hover:opacity-80 transition-opacity ${style.bg}`}
              >
                <span className="text-2xl flex-shrink-0">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{item.question_title}</p>
                  <p className="text-sm text-gray-600">{style.label}{item.feedback ? ` — ${item.feedback}` : ''}</p>
                  {item.class_title && <p className="text-xs text-gray-400 mt-0.5">{item.class_title}</p>}
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
