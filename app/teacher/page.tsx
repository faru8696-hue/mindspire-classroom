import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeacherDashboard() {
  const supabase = await createClient()

  const [{ count: studentCount }, { count: pendingCount }, { count: unitCount }, { count: submissionCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('approved', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('approved', false),
    supabase.from('units').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
  ])

  const cards = [
    { label: 'Active Students', value: studentCount ?? 0, href: '/teacher/students', color: 'bg-purple-100 text-purple-800', icon: '👩‍🎓' },
    { label: 'Pending Approval', value: pendingCount ?? 0, href: '/teacher/students', color: 'bg-amber-100 text-amber-800', icon: '⏳' },
    { label: 'Units Created', value: unitCount ?? 0, href: '/teacher/content', color: 'bg-blue-100 text-blue-800', icon: '📚' },
    { label: 'Submissions', value: submissionCount ?? 0, href: '/teacher/submissions', color: 'bg-green-100 text-green-800', icon: '📝' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">Teacher Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className={`${card.color} rounded-xl p-5 hover:opacity-80 transition-opacity`}>
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm font-medium mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/teacher/whiteboard" className="bg-purple-700 text-white rounded-xl p-6 hover:bg-purple-800 transition-colors">
          <div className="text-4xl mb-3">🖊️</div>
          <h2 className="text-xl font-bold mb-1">Start Live Whiteboard</h2>
          <p className="text-purple-200 text-sm">Draw on screen — students see it in real time</p>
        </Link>
        <Link href="/teacher/submissions" className="bg-indigo-700 text-white rounded-xl p-6 hover:bg-indigo-800 transition-colors">
          <div className="text-4xl mb-3">✏️</div>
          <h2 className="text-xl font-bold mb-1">Review Student Work</h2>
          <p className="text-indigo-200 text-sm">Check submissions and leave feedback</p>
        </Link>
      </div>
    </div>
  )
}
