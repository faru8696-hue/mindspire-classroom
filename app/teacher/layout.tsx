import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'teacher') redirect('/')

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-purple-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">⚛️ Mindspire Lab</span>
          <Link href="/teacher" className="text-purple-200 hover:text-white text-sm transition-colors">Dashboard</Link>
          <Link href="/teacher/students" className="text-purple-200 hover:text-white text-sm transition-colors">Students</Link>
          <Link href="/teacher/content" className="text-purple-200 hover:text-white text-sm transition-colors">Content</Link>
          <Link href="/teacher/submissions" className="text-purple-200 hover:text-white text-sm transition-colors">Submissions</Link>
          <Link href="/teacher/whiteboard" className="text-purple-200 hover:text-white text-sm transition-colors">Whiteboard</Link>
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
