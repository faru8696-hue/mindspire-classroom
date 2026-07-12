export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import TeacherNotificationBell from '@/components/TeacherNotificationBell'
import TeacherClassNav from '@/components/TeacherClassNav'

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
  const admin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: classList } = await admin.from('classes').select('id, title').order('order_index')
  const { data: notifs } = await admin
    .from('notifications')
    .select('id, type, student_id, question_id, class_id, created_at, read, message, profiles:profiles!notifications_student_id_fkey(full_name), questions:questions!notifications_question_id_fkey(title)')
    .order('created_at', { ascending: false })
    .limit(30)

  const initialNotifications = (notifs ?? []).map((n: {
    id: string; type: string; student_id: string; question_id: string; class_id: string;
    created_at: string; read: boolean; message: string | null;
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
    message: n.message,
    student_name: Array.isArray(n.profiles) ? n.profiles[0]?.full_name : n.profiles?.full_name,
    question_title: Array.isArray(n.questions) ? n.questions[0]?.title : n.questions?.title,
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 bg-purple-900 text-white px-6 py-3 flex items-center justify-between shadow-lg z-50">
        <div className="flex items-center gap-6">
          <Link href="/teacher" className="font-bold text-lg hover:text-purple-200 transition-colors">⚛️ Mindspire Lab</Link>
          <Link href="/teacher" className="text-purple-200 hover:text-white text-sm transition-colors">Dashboard</Link>
          <TeacherClassNav classes={classList ?? []} />
          <Link href="/teacher/students" className="text-purple-200 hover:text-white text-sm transition-colors">Students</Link>
          <Link href="/teacher/content" className="text-purple-200 hover:text-white text-sm transition-colors">Content</Link>
          <Link href="/teacher/submissions" className="text-purple-200 hover:text-white text-sm transition-colors">Submissions</Link>
          <Link href="/teacher/progress" className="text-purple-200 hover:text-white text-sm transition-colors">Progress</Link>
          <Link href="/teacher/activity" className="text-purple-200 hover:text-white text-sm transition-colors">Activity</Link>
        </div>
        <div className="flex items-center gap-3">
          <TeacherNotificationBell initialNotifications={initialNotifications} classes={classList ?? []} />
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
