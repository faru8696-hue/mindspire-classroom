import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LiveNotificationFeed from '@/components/LiveNotificationFeed'

export default async function TeacherDashboard() {
  const supabase = await createAdminClient()

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

  type LatestSub = { id: string; student_id: string; question_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }
  // Latest submission per student (for thumbnails)
  const { data: latestSubs } = questionIds.length > 0
    ? await supabase.from('submissions')
        .select('id, student_id, question_id, canvas_data, text_answer, updated_at')
        .in('question_id', questionIds)
        .order('updated_at', { ascending: false })
    : { data: [] as LatestSub[] }

  // Recent submissions needing feedback (for dashboard feed)
  type RecentSub = { id: string; student_id: string; question_id: string; updated_at: string; profiles: { full_name: string } | null; questions: { title: string; topic_id: string } | null }
  const { data: recentSubs } = await supabase
    .from('submissions')
    .select('id, student_id, question_id, updated_at, profiles(full_name), questions(title, topic_id)')
    .order('updated_at', { ascending: false })
    .limit(8)

  // Latest feedback per submission
  const subIds = (latestSubs ?? []).map(s => s.id)
  const { data: feedbacks } = subIds.length > 0
    ? await supabase.from('feedback').select('submission_id, grade').in('submission_id', subIds)
    : { data: [] }

  const gradeBySubmission = new Map((feedbacks ?? []).map(f => [f.submission_id, f.grade]))

  // Per student: latest submission
  const latestSubByStudent = new Map<string, LatestSub>()
  for (const sub of latestSubs ?? []) {
    if (!latestSubByStudent.has(sub.student_id)) latestSubByStudent.set(sub.student_id, sub)
  }

  // Per-class stats
  const classStats = (classes ?? []).map(cls => {
    const classUnits = (units ?? []).filter(u => u.class_id === cls.id)
    const classTopics = (topics ?? []).filter(t => classUnits.some(u => u.id === t.unit_id))
    const classQIds = (questions ?? []).filter(q => classTopics.some(t => t.id === q.topic_id)).map(q => q.id)
    const classStudents = (classEnrollments ?? [])
      .filter(e => e.class_id === cls.id)
      .map(e => ({ ...profileMap.get(e.student_id), id: e.student_id }))
      .filter(s => s.full_name) // only approved students with profiles
    return {
      ...cls,
      studentCount: classStudents.length,
      questionCount: classQIds.length,
      students: classStudents as { id: string; full_name: string; avatar_url?: string | null; nickname?: string | null }[],
    }
  })

  const GRADE_BORDER: Record<string, string> = {
    correct: 'border-green-400',
    partial: 'border-amber-400',
    incorrect: 'border-red-400',
    discussed: 'border-blue-400',
    needsmore: 'border-purple-400',
  }
  const GRADE_BADGE: Record<string, string> = {
    correct: 'bg-green-500',
    partial: 'bg-amber-500',
    incorrect: 'bg-red-500',
    discussed: 'bg-blue-500',
    needsmore: 'bg-purple-500',
  }
  const GRADE_SYMBOL: Record<string, string> = {
    correct: '✓', partial: '~', incorrect: '✗', discussed: '💬', needsmore: '🔄',
  }

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
        <Link href="/teacher/content" className="bg-blue-100 text-blue-800 rounded-xl p-5 hover:opacity-80 transition-opacity">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-3xl font-bold">{questions?.length ?? 0}</div>
          <div className="text-sm font-medium mt-1">Total Questions</div>
        </Link>
      </div>

      {/* Classroom overview — all students per class */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Classroom Overview</h2>
        {classStats.length === 0 ? (
          <p className="text-gray-500 text-sm">No classes yet. <Link href="/teacher/content" className="text-purple-600 underline">Create one →</Link></p>
        ) : classStats.map(cls => (
          <div key={cls.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-800">{cls.title}</h3>
                <p className="text-xs text-gray-500">{cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''} · {cls.questionCount} questions</p>
              </div>
              <Link href={`/teacher/class/${cls.id}`} className="text-xs text-purple-600 hover:underline font-medium">Manage class →</Link>
            </div>
            {cls.students.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No students enrolled</p>
            ) : (
              <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
                {cls.students.map(student => {
                  const sub = latestSubByStudent.get(student.id)
                  const grade = sub ? gradeBySubmission.get(sub.id) ?? null : null
                  const displayName = (student as { nickname?: string | null }).nickname || student.full_name
                  const avatarUrl = (student as { avatar_url?: string | null }).avatar_url
                  return (
                    <Link
                      key={student.id}
                      href={`/teacher/students/${student.id}`}
                      className={`flex flex-col rounded-xl border-2 overflow-hidden hover:scale-105 hover:shadow-lg transition-all bg-gray-50 ${grade ? GRADE_BORDER[grade] : sub ? 'border-blue-400' : 'border-gray-200'}`}
                    >
                      {/* Work thumbnail */}
                      <div className="w-full aspect-video bg-gray-100 relative overflow-hidden">
                        {sub?.canvas_data ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sub.canvas_data} alt="" className="w-full h-full object-contain" />
                        ) : sub?.text_answer ? (
                          <div className="p-1 text-xs text-gray-500 overflow-hidden h-full line-clamp-3">{sub.text_answer}</div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-300 text-xs">No work</span>
                          </div>
                        )}
                        {grade && (
                          <span className={`absolute bottom-0.5 right-0.5 text-xs px-1 py-0.5 rounded font-bold text-white ${GRADE_BADGE[grade]}`}>
                            {GRADE_SYMBOL[grade]}
                          </span>
                        )}
                      </div>
                      {/* Avatar + name */}
                      <div className="flex items-center gap-1.5 px-2 py-1.5">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-700 truncate">{displayName}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

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
