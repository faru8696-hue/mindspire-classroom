import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import ProfileGate from '@/components/ProfileGate'
import SchoolTopicsGate from '@/components/SchoolTopicsGate'
import StudentNotificationBell from '@/components/StudentNotificationBell'
import { isClassCurrent } from '@/lib/schoolTopicsStatus'

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
    .select('parent_name, parent_phone, parent_email')
    .eq('id', session.user.id)
    .maybeSingle()

  const p = { ...profile, ...(extProfile ?? {}) } as Record<string, string | null | undefined>
  // Only enforce gate if ALL extended columns exist (i.e. migration has been run)
  const extColumnsExist = extProfile !== null && 'parent_name' in (extProfile ?? {})
  const profileComplete = !extColumnsExist || !!(p.grade_level && p.phone && p.parent_name && p.parent_phone && p.parent_email)

  // Enrolled class IDs for notification bell — kept unfiltered (notifications
  // aren't about group planning, so a non-group student still gets them).
  const admin = createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: enrollmentsFull, error: enrollErr } = await admin
    .from('class_enrollments').select('class_id, in_group').eq('student_id', session.user.id)
  const enrollments: { class_id: string; in_group?: boolean }[] = enrollErr
    ? ((await admin.from('class_enrollments').select('class_id').eq('student_id', session.user.id)).data ?? [])
    : (enrollmentsFull ?? [])
  const enrolledClassIds = enrollments.map(e => e.class_id)
  // Only group-enrolled classes are subject to the School Topics gate below
  // — a student marked not-in-group for a class isn't asked about it.
  const groupClassIds = enrollments.filter(e => e.in_group !== false).map(e => e.class_id)

  // School-topics gate: a class counts as "done" once the student has a
  // CURRENT topic/status signal for it — a test date (or "hasn't started"
  // start date) in the past no longer counts, same as an expired signal, so
  // the student is asked again. Guarded by the error checks below so this
  // gate stays off (never locks anyone out) until all migrations have
  // actually been run — same defensive pattern as extColumnsExist above.
  const { data: planRows, error: planErr } = await admin
    .from('student_topic_plans').select('class_id, test_date').eq('student_id', session.user.id)
  const { data: statusRows, error: statusErr } = await admin
    .from('student_school_status').select('class_id, not_started, starts_on, other_topics').eq('student_id', session.user.id)
  const schoolTopicsTablesExist = !planErr && !statusErr
  const todayIso = new Date().toISOString().slice(0, 10)
  const plans = (planRows ?? []).map((r: { class_id: string; test_date: string | null }) => ({ classId: r.class_id, testDate: r.test_date }))
  const statusByClass = new Map(
    (statusRows ?? []).map((r: { class_id: string; not_started: boolean; starts_on: string | null; other_topics: string | null }) =>
      [r.class_id, { notStarted: r.not_started, startsOn: r.starts_on, otherTopics: r.other_topics }])
  )
  const schoolTopicsComplete = !schoolTopicsTablesExist || groupClassIds.length === 0
    || groupClassIds.every(id => isClassCurrent(id, plans, statusByClass.get(id), todayIso))

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 bg-purple-900 text-white px-6 py-3 flex items-center justify-between shadow-lg z-50">
        <div className="flex items-center gap-4">
          <Link href="/student" className="font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity">⚛️ Mindspire Lab</Link>
          <Link href="/student" className="text-purple-200 hover:text-white text-sm transition-colors">My Classes</Link>
          <Link href="/student/school-topics" className="text-purple-200 hover:text-white text-sm transition-colors">School Topics</Link>
          <Link href="/student/assignments" className="text-purple-200 hover:text-white text-sm transition-colors">Assignments</Link>
          <Link href="/student/tests" className="text-purple-200 hover:text-white text-sm transition-colors">Tests</Link>
          <Link href="/student/review" className="text-purple-200 hover:text-white text-sm transition-colors">Review</Link>
          <Link href="/student/notifications" className="text-purple-200 hover:text-white text-sm transition-colors">Notifications</Link>
          <Link href="/student/profile" className="text-purple-200 hover:text-white text-sm transition-colors">Profile</Link>
        </div>
        <div className="flex items-center gap-4">
          <StudentNotificationBell classIds={enrolledClassIds} studentId={session.user.id} />
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
        <ProfileGate profileComplete={profileComplete}>
          <SchoolTopicsGate complete={schoolTopicsComplete}>{children}</SchoolTopicsGate>
        </ProfileGate>
      </main>
    </div>
  )
}
