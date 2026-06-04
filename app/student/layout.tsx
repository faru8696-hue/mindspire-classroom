import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, approved')
    .eq('id', session.user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'teacher') redirect('/teacher')
  if (!profile.approved) redirect('/pending')

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-purple-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">⚛️ Mindspire Lab</span>
          <Link href="/student" className="text-purple-200 hover:text-white text-sm transition-colors">My Units</Link>
          <Link href="/student/whiteboard" className="text-purple-200 hover:text-white text-sm transition-colors">Live Board</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-purple-200 text-sm">{profile.full_name}</span>
          <form action={logout}>
            <button className="text-sm bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded-lg transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
