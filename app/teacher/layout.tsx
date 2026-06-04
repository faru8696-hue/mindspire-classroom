import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import TeacherNotificationBell from '@/components/TeacherNotificationBell'

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

  // Load recent unread notifications for the bell
  const admin = await createAdminClient()
  const { data: notifs } = await admin
    .from('notifications')
    .select('id, type, student_id, question_id, class_id, created_at, read, profiles:profiles!notifications_student_id_fkey(full_name), questions:questions!notifications_question_id_fkey(title)')
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(20)

  const initialNotifications = (notifs ?? []).map((n: {
    id: string; type: string; student_id: string; question_id: string; class_id: string;
    created_at: string; read: boolean;
    profiles: { full_name: string }[] | { full_name: string } | null;
    questions: { title: string }[] | { title: string } | null;
  }) => ({
    id: n.id,
    type: n.type,
    student_id: n.student_id,
    question_id: n.question_id,
    class_id: n.class_id,
    created_at: n.created_at,
    read: n.read,
    student_name: Array.isArray(n.profiles) ? n.profiles[0]?.full_name : n.profiles?.full_name,
    question_title: Array.isArray(n.questions) ? n.questions[0]?.title : n.questions?.title,
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-purple-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">⚛️ Mindspire Lab</span>
          <Link href="/teacher" className="text-purple-200 hover:text-white text-sm transition-colors">Dashboard</Link>
          <Link href="/teacher/progress" className="text-purple-200 hover:text-white text-sm transition-colors">Progress</Link>
          <Link href="/teacher/students" className="text-purple-200 hover:text-white text-sm transition-colors">Students</Link>
          <Link href="/teacher/content" className="text-purple-200 hover:text-white text-sm transition-colors">Content</Link>
          <Link href="/teacher/submissions" className="text-purple-200 hover:text-white text-sm transition-colors">Submissions</Link>
          <Link href="/teacher/whiteboard" className="text-purple-200 hover:text-white text-sm transition-colors">Whiteboard</Link>
        </div>
        <div className="flex items-center gap-3">
          <TeacherNotificationBell initialNotifications={initialNotifications} />
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
