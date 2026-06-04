import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

  // For each class: count enrolled students and get submission/question counts
  const classIds = classes?.map(c => c.id) ?? []

  const [{ data: enrollments }, { data: units }, { data: pendingFeedback }] = await Promise.all([
    classIds.length > 0
      ? supabase.from('profiles').select('id, full_name, class_id').eq('role', 'student').eq('approved', true).in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? supabase.from('units').select('id, class_id').in('class_id', classIds)
      : Promise.resolve({ data: [] }),
    supabase.from('submissions').select('id, question_id, questions!inner(topic_id, topics!inner(unit_id, units!inner(class_id)))', { count: 'exact', head: false })
      .not('id', 'in', supabase.from('feedback').select('submission_id')),
  ])

  const unitIds = units?.map(u => u.id) ?? []
  const [{ data: topics }, { data: recentSubmissions }] = await Promise.all([
    unitIds.length > 0
      ? supabase.from('topics').select('id, unit_id').in('unit_id', unitIds)
      : Promise.resolve({ data: [] }),
    supabase.from('submissions')
      .select('id, created_at, student_id, question_id, profiles!submissions_student_id_fkey(full_name), questions(title, topic_id, topics(unit_id, units(class_id, title: class_id)))')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const topicIds = topics?.map(t => t.id) ?? []
  const { data: questions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, topic_id').in('topic_id', topicIds)
    : { data: [] }

  // Per-class stats
  const classStats = (classes ?? []).map(cls => {
    const classUnits = units?.filter(u => u.class_id === cls.id) ?? []
    const classTopics = topics?.filter(t => classUnits.some(u => u.id === t.unit_id)) ?? []
    const classQIds = questions?.filter(q => classTopics.some(t => t.id === q.topic_id)).map(q => q.id) ?? []
    const classStudents = enrollments?.filter(e => e.class_id === cls.id) ?? []
    return {
      ...cls,
      studentCount: classStudents.length,
      questionCount: classQIds.length,
    }
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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

      {/* Class cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Classes</h2>
        {classStats.length === 0 ? (
          <p className="text-gray-500 text-sm">No classes yet. <Link href="/teacher/content" className="text-purple-600 underline">Create one →</Link></p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {classStats.map(cls => (
              <Link
                key={cls.id}
                href={`/teacher/class/${cls.id}`}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-800 transition-colors">{cls.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''} enrolled</p>
                  </div>
                  <span className="text-2xl">🏫</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{cls.questionCount} questions</span>
                  <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium">View progress →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/teacher/whiteboard" className="bg-purple-700 text-white rounded-xl p-5 hover:bg-purple-800 transition-colors">
          <div className="text-3xl mb-2">🖊️</div>
          <h2 className="text-base font-bold mb-1">Live Whiteboard</h2>
          <p className="text-purple-200 text-xs">Draw on screen in real time</p>
        </Link>
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
