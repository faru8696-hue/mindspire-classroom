import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import ProfileGate from '@/components/ProfileGate'
import StudentNotificationBell from '@/components/StudentNotificationBell'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, approved, avatar_url, nickname, grade_level, phone')
    .eq('id', session.user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'teacher') redirect('/teacher')
  if (!profile.approved) redirect('/pending')

  // Fetch extended fields separately — these columns require a migration and may not exist yet
  const { data: extProfile } = await supabase
    .from('profiles')
    .select('parent_name, parent_phone')
    .eq('id', session.user.id)
    .maybeSingle()

  const p = { ...profile, ...(extProfile ?? {}) } as Record<string, string | null | undefined>
  // Only enforce gate if ALL extended columns exist (i.e. migration has been run)
  const extColumnsExist = extProfile !== null && 'parent_name' in (extProfile ?? {})
  const profileComplete = !extColumnsExist || !!(p.grade_level && p.phone && p.parent_name && p.parent_phone)

  // Enrolled class IDs for notification bell
  const admin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: enrollments } = await admin.from('class_enrollments').select('class_id').eq('student_id', session.user.id)
  const enrolledClassIds = (enrollments ?? []).map((e: { class_id: string }) => e.class_id)

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 bg-purple-900 text-white px-6 py-3 flex items-center justify-between shadow-lg z-50">
        <div className="flex items-center gap-4">
          <Link href="/student" className="font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity">⚛️ Mindspire Lab</Link>
          <Link href="/student" className="text-purple-200 hover:text-white text-sm transition-colors">My Classes</Link>
          <Link href="/student/assignments" className="text-purple-200 hover:text-white text-sm transition-colors">Assignments</Link>
          <Link href="/student/profile" className="text-purple-200 hover:text-white text-sm transition-colors">Profile</Link>
        </div>
        <div className="flex items-center gap-4">
          <StudentNotificationBell classIds={enrolledClassIds} />
          <Link href="/student/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="avatar" className="w-7 h-7 rounded-full object-cover border-2 border-purple-400" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-purple-400 flex items-center justify-center text-xs font-bold text-white">
                {((profile.nickname || profile.full_name) ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-purple-200 text-sm">{profile.nickname || profile.full_name}</span>
          </Link>
          <form action={logout}>
            <button className="text-sm bg-purple-700 hover:bg-purple-600 px-3 py-1 rounded-lg transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="flex-1 p-6">
        <ProfileGate profileComplete={profileComplete}>{children}</ProfileGate>
      </main>
    </div>
  )
}
