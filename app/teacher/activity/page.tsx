import { getRecentActivity } from '@/lib/activity'
import ActivityFeed from '@/components/ActivityFeed'

export const dynamic = 'force-dynamic'

// Everyone's recent activity — help requests, done pings, comments, grades,
// and AI Faridah usage across all students, newest first. Reload the page
// to refresh (matches how the other list-heavy teacher pages, like
// Progress, already work — no live socket needed for a history view).
export default async function ActivityPage() {
  const events = await getRecentActivity({ limit: 200 })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-purple-900">Recent Activity</h1>
        <p className="text-xs text-gray-400">Last 200 events across all students</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <ActivityFeed events={events} />
      </div>
    </div>
  )
}
