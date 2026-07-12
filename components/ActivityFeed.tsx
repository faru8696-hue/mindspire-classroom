import Link from 'next/link'
import type { ActivityEvent } from '@/lib/activity'

const TYPE_META: Record<ActivityEvent['type'], { icon: string; verb: string; cls: string }> = {
  help:       { icon: '🙋', verb: 'asked for help on',        cls: 'bg-amber-50 border-amber-200' },
  submitted:  { icon: '✓',  verb: 'marked done on',           cls: 'bg-purple-50 border-purple-200' },
  comment:    { icon: '💬', verb: 'commented on',              cls: 'bg-blue-50 border-blue-200' },
  assignment: { icon: '📋', verb: 'was assigned',              cls: 'bg-gray-50 border-gray-200' },
  graded:     { icon: '📝', verb: 'was graded on',             cls: 'bg-green-50 border-green-200' },
  ai_chat:    { icon: '🎓', verb: 'asked AI Faridah about',    cls: 'bg-indigo-50 border-indigo-200' },
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

// Renders a normalized activity feed (see lib/activity.ts) — used both for
// the global "everyone's recent activity" page and a single student's
// activity history. `showStudentName` is off on the per-student view since
// it's redundant there.
export default function ActivityFeed({ events, showStudentName = true }: { events: ActivityEvent[]; showStudentName?: boolean }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No activity yet.</p>
  }

  return (
    <div className="space-y-1.5">
      {events.map(e => {
        const meta = TYPE_META[e.type]
        return (
          <div key={e.id} className={`flex items-start gap-3 px-3 py-2 rounded-lg border ${meta.cls}`}>
            <span className="text-lg flex-shrink-0 mt-0.5">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">
                {showStudentName && <span className="font-semibold">{e.studentName}</span>}
                {showStudentName && ' '}
                {meta.verb}
                {e.questionId ? (
                  <>
                    {' '}
                    <Link href={`/teacher/questions/${e.questionId}`} className="text-purple-600 hover:underline font-medium">
                      {e.questionTitle ?? 'a question'}
                    </Link>
                  </>
                ) : ' a question'}
                {e.grade && (
                  <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${e.grade === 'correct' ? 'bg-green-100 text-green-700' : e.grade === 'incomplete' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                    {e.grade}
                  </span>
                )}
              </p>
              {e.message && <p className="text-xs text-gray-500 italic truncate mt-0.5">&ldquo;{e.message}&rdquo;</p>}
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(e.createdAt)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
