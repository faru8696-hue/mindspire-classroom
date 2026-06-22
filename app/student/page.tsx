import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StudentDashboard() {
  const supabase = await createClient()
  // getUser() validates the token (and reflects the proxy's refresh) instead of
  // trusting a possibly-stale local session. Redirect on a momentarily-null auth
  // rather than crashing the page render.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: enrollments } = await admin
    .from('class_enrollments')
    .select('class_id, classes(id, title)')
    .eq('student_id', user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classes = (enrollments ?? []).map((e: any) => {
    const c = e.classes
    return Array.isArray(c) ? c[0] : c
  }).filter(Boolean) as { id: string; title: string }[]

  if (classes.length === 1) {
    redirect(`/student/${classes[0].id}`)
  }

  if (classes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center min-h-96">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-purple-900 mb-2">No Class Assigned Yet</h2>
          <p className="text-gray-500">Your teacher hasn't assigned you to a class yet. Check back soon!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">My Classes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {classes.map(cls => (
          <Link
            key={cls.id}
            href={`/student/${cls.id}`}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <div className="text-3xl mb-3">📚</div>
            <h2 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">{cls.title}</h2>
            <p className="text-sm text-purple-600 mt-1">Open class →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
