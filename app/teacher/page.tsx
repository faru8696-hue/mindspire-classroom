import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import LiveNotificationFeed from '@/components/LiveNotificationFeed'

function adminDb() {
  return createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export default async function TeacherDashboard() {
  const supabase = adminDb()

  const [
    { count: studentCount },
    { count: pendingCount },
    { data: classes },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('approved', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('approved', false),
    supabase.from('classes').select('id, title').order('order_index'),
  ])

  const classIds = classes?.map(c => c.id) ?? []

  const [{ data: classEnrollments }, { data: units }, { data: pendingFeedback }] = await Promise.all([
    classIds.length > 0
      ? supabase.from('class_enrollments').select('student_id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('units').select('id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    supabase.from('submissions').select('id, question_id, questions!inner(topic_id, topics!inner(unit_id, units!inner(class_id)))', { count: 'exact', head: false })
      .not('id', 'in', supabase.from('feedback').select('submission_id')),
  ])

  // Fetch profiles for all enrolled students
  const enrolledStudentIds = [...new Set((classEnrollments ?? []).map(e => e.student_id))]
  const { data: studentProfiles } = enrolledStudentIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, avatar_url, nickname').in('id', enrolledStudentIds)
    : { data: [] as { id: string; full_name: string; avatar_url: string | null; nickname: string | null }[] }

  const profileMap = new Map((studentProfiles ?? []).map(p => [p.id, p]))

  const unitIds = units?.map(u => u.id) ?? []
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, unit_id').in('unit_id', unitIds)
    : { data: [] }

  const topicIds = (topics ?? []).map(t => t.id)
  const { data: questions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, topic_id').in('topic_id', topicIds)
    : { data: [] }

  const questionIds = (questions ?? []).map(q => q.id)

  type Sub = { id: string; student_id: string; question_id: string; updated_at: string }
  // All submissions across every class's questions — used to compute a
  // correctly per-class "N need grading" count below.
  const { data: allSubs } = questionIds.length > 0
    ? await supabase.from('submissions')
        .select('id, student_id, question_id, updated_at')
        .in('question_id', questionIds)
    : { data: [] as Sub[] }

  // Recent submissions needing feedback (for dashboard feed)
  type RecentSub = { id: string; student_id: string; question_id: string; updated_at: string; profiles: { full_name: string } | null; questions: { title: string; topic_id: string } | null }
  const { data: recentSubs } = await supabase
    .from('submissions')
    .select('id, student_id, question_id, updated_at, profiles(full_name), questions(title, topic_id)')
    .order('updated_at', { ascending: false })
    .limit(8)

  // Recent notifications
  type RecentNotif = { id: string; type: string; student_id: string; question_id: string; class_id: string; created_at: string; read: boolean; profiles: { full_name: string } | null; questions: { title: string } | null }
  const { data: recentNotifs } = await supabase
    .from('notifications')
    .select('id, type, student_id, question_id, class_id, created_at, read, profiles:profiles!notifications_student_id_fkey(full_name), questions:questions!notifications_question_id_fkey(title)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Latest feedback per submission — used to tell "graded" from "still needs grading"
  const subIds = (allSubs ?? []).map(s => s.id)
  const { data: feedbacks } = subIds.length > 0
    ? await supabase.from('feedback').select('submission_id, grade').in('submission_id', subIds)
    : { data: [] }

  const gradeBySubmission = new Map((feedbacks ?? []).map(f => [f.submission_id, f.grade]))

  // Per-class stats. Each class's ungraded count is scoped to THAT class's
  // own questions — the previous version picked each student's single most
  // recently updated submission across ALL classes and showed it under every
  // class card, so a student's AP Chemistry work would visibly "leak" onto
  // their Honors Chemistry card even if that class had zero questions.
  const classStats = (classes ?? []).map(cls => {
    const classUnits = (units ?? []).filter(u => u.class_id === cls.id)
    const classTopics = (topics ?? []).filter(t => classUnits.some(u => u.id === t.unit_id))
    const classQIds = new Set((questions ?? []).filter(q => classTopics.some(t => t.id === q.topic_id)).map(q => q.id))
    const classStudents = (classEnrollments ?? [])
      .filter(e => e.class_id === cls.id)
      .map(e => ({ ...profileMap.get(e.student_id), id: e.student_id }))
      .filter(s => s.full_name) // only approved students with profiles

    const classSubs = (allSubs ?? []).filter(s => classQIds.has(s.question_id))
    const ungradedCount = classSubs.filter(s => !gradeBySubmission.get(s.id)).length

    return {
      ...cls,
      studentCount: classStudents.length,
      questionCount: classQIds.size,
      submittedCount: classSubs.length,
      ungradedCount,
      students: classStudents as { id: string; full_name: string; avatar_url?: string | null; nickname?: string | null }[],
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">Teacher Dashboard</h1>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/teacher/students" className="bg-purple-100 text-purple-800 rounded-xl p-5 hover:opacity-80 transition-opacity">
          <div className="text-3xl mb-2">👩‍🎓</div>
          <div className="text-3xl font-bold">{studentCount ?? 0}</div>
          <div className="text-sm font-medium mt-1">Active Students</div>
        </Link>
        <Link href="/teacher/students" className="bg-amber-100 text-amber-800 rounded-xl p-5 hover:opacity-80 transition-opacity">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-3xl font-bold">{pendingCount ?? 0}</div>
          <div className="text-sm font-medium mt-1">Pending Approval</div>
        </Link>
        <Link href="/teacher/submissions" className="bg-indigo-100 text-indigo-800 rounded-xl p-5 hover:opacity-80 transition-opacity">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-3xl font-bold">{pendingFeedback?.length ?? 0}</div>
          <div className="text-sm font-medium mt-1">Needs Grading</div>
        </Link>
        <div className="bg-red-100 text-red-800 rounded-xl p-5">
          <div className="text-3xl mb-2">🆘</div>
          <div className="text-3xl font-bold">{(recentNotifs as unknown as RecentNotif[])?.filter(n => !n.read).length ?? 0}</div>
          <div className="text-sm font-medium mt-1">Unread Alerts</div>
        </div>
      </div>

      {/* Classes at a glance — enrollment, content, and grading load per
          class, each correctly scoped to that class's own questions. */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Classes</h2>
        {classStats.length === 0 ? (
          <p className="text-gray-500 text-sm">No classes yet. <Link href="/teacher/content" className="text-purple-600 underline">Create one →</Link></p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {classStats.map(cls => (
              <div key={cls.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <h3 className="font-bold text-gray-800">{cls.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''} · {cls.questionCount} question{cls.questionCount !== 1 ? 's' : ''} assigned
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {cls.ungradedCount > 0 ? (
                    <Link
                      href={`/teacher/submissions?class=${cls.id}`}
                      className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors"
                    >
                      {cls.ungradedCount} to grade
                    </Link>
                  ) : cls.submittedCount > 0 ? (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">All caught up</span>
                  ) : (
                    <span className="text-xs text-gray-400">No submissions yet</span>
                  )}
                  <Link href={`/teacher/class/${cls.id}`} className="text-xs text-purple-600 hover:underline font-medium whitespace-nowrap">Manage class →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications panel */}
      {(recentNotifs ?? []).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🔔 Student Alerts</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-50">
            {(recentNotifs as unknown as RecentNotif[]).map(n => {
              const studentName = Array.isArray(n.profiles) ? n.profiles[0]?.full_name : n.profiles?.full_name
              const questionTitle = Array.isArray(n.questions) ? n.questions[0]?.title : n.questions?.title
              const minutesAgo = Math.round((Date.now() - new Date(n.created_at).getTime()) / 60000)
              const timeLabel = minutesAgo < 60 ? `${minutesAgo}m ago` : minutesAgo < 1440 ? `${Math.round(minutesAgo / 60)}h ago` : `${Math.round(minutesAgo / 1440)}d ago`
              const icon = n.type === 'help' ? '🆘' : n.type === 'submitted' ? '✅' : n.type === 'comment' ? '💬' : '📬'
              const label = n.type === 'help' ? 'asked for help' : n.type === 'submitted' ? 'submitted work' : n.type === 'comment' ? 'left a comment' : n.type
              return (
                <Link key={n.id} href={`/teacher/live/${n.class_id}/${n.question_id}`} className={`flex items-center gap-4 px-5 py-3 hover:bg-purple-50 transition-colors ${n.read ? 'opacity-50' : ''}`}>
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800"><span className="font-semibold">{studentName}</span> {label}</p>
                    {questionTitle && <p className="text-xs text-gray-400 truncate">{questionTitle}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{timeLabel}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent submissions feed */}
      {(recentSubs ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Recent Submissions</h2>
            <Link href="/teacher/submissions" className="text-sm text-purple-600 hover:underline">View all →</Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-50">
            {(recentSubs as unknown as RecentSub[]).map(sub => {
              const student = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles
              const question = Array.isArray(sub.questions) ? sub.questions[0] : sub.questions
              const minutesAgo = Math.round((Date.now() - new Date(sub.updated_at).getTime()) / 60000)
              const timeLabel = minutesAgo < 60
                ? `${minutesAgo}m ago`
                : minutesAgo < 1440
                  ? `${Math.round(minutesAgo / 60)}h ago`
                  : `${Math.round(minutesAgo / 1440)}d ago`
              return (
                <Link
                  key={sub.id}
                  href={`/teacher/submissions`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-purple-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 flex-shrink-0">
                    {(student?.full_name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{student?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-gray-400 truncate">{question?.title ?? 'Unknown question'}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{timeLabel}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Live alerts */}
      <LiveNotificationFeed />

      {/* Quick actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/teacher/submissions" className="bg-indigo-700 text-white rounded-xl p-5 hover:bg-indigo-800 transition-colors">
          <div className="text-3xl mb-2">✏️</div>
          <h2 className="text-base font-bold mb-1">Review Work</h2>
          <p className="text-indigo-200 text-xs">Grade submissions and leave feedback</p>
        </Link>
        <Link href="/teacher/content" className="bg-blue-700 text-white rounded-xl p-5 hover:bg-blue-800 transition-colors">
          <div className="text-3xl mb-2">📖</div>
          <h2 className="text-base font-bold mb-1">Manage Content</h2>
          <p className="text-blue-200 text-xs">Add units, topics, and questions</p>
        </Link>
        <Link href="/teacher/progress" className="bg-green-700 text-white rounded-xl p-5 hover:bg-green-800 transition-colors">
          <div className="text-3xl mb-2">📊</div>
          <h2 className="text-base font-bold mb-1">All Progress</h2>
          <p className="text-green-200 text-xs">Every student across all classes</p>
        </Link>
      </div>
    </div>
  )
}
