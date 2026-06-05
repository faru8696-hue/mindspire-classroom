import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const GRADE_STYLE = {
  correct:   { label: '✓ Correct',  className: 'bg-green-100 text-green-700' },
  partial:   { label: '~ Partial',  className: 'bg-amber-100 text-amber-700' },
  incorrect: { label: '✗ Incorrect', className: 'bg-red-100 text-red-600' },
}

export default async function AssignmentsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const studentId = session.user.id

  const admin = await createAdminClient()

  // 1. Get all enrolled classes
  const { data: enrollments } = await admin
    .from('class_enrollments')
    .select('class_id')
    .eq('student_id', studentId)
  const classIds = (enrollments ?? []).map((e: { class_id: string }) => e.class_id)

  if (classIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-purple-900 mb-4">My Assignments</h1>
        <p className="text-gray-500">You are not enrolled in any classes yet.</p>
      </div>
    )
  }

  // 2. Get all assigned question IDs (class-level + student-level)
  const [{ data: classAssignments }, { data: studentAssignments }] = await Promise.all([
    admin.from('assignments').select('question_id, class_id, due_date').in('class_id', classIds),
    admin.from('student_assignments').select('question_id').eq('student_id', studentId),
  ])

  const dueDateByQuestion = new Map(
    (classAssignments ?? [])
      .filter((a: { question_id: string; due_date?: string | null }) => a.due_date)
      .map((a: { question_id: string; due_date: string }) => [a.question_id, a.due_date])
  )

  const assignedIdSet = new Set<string>([
    ...(classAssignments ?? []).map((a: { question_id: string }) => a.question_id),
    ...(studentAssignments ?? []).map((a: { question_id: string }) => a.question_id),
  ])
  const assignedIds = [...assignedIdSet]

  if (assignedIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-purple-900 mb-4">My Assignments</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-gray-500">No assignments yet. Check back after your next session!</p>
        </div>
      </div>
    )
  }

  // 3. Get question details with topic/unit/class path
  const { data: questions } = await admin
    .from('questions')
    .select('id, title, content, topic_id, topics(id, title, unit_id, units(id, title, class_id, classes(id, title)))')
    .in('id', assignedIds)

  // 4. Get submissions + feedback for this student
  const { data: submissions } = await admin
    .from('submissions')
    .select('id, question_id, updated_at')
    .eq('student_id', studentId)
    .in('question_id', assignedIds)

  const submissionIds = (submissions ?? []).map((s: { id: string }) => s.id)
  const { data: feedbacks } = submissionIds.length > 0
    ? await admin.from('feedback').select('submission_id, grade, text_feedback').in('submission_id', submissionIds)
    : { data: [] }

  // Lookup maps
  const submissionByQuestion = new Map(
    (submissions ?? []).map((s: { id: string; question_id: string; updated_at: string }) => [s.question_id, s])
  )
  const feedbackBySubmission = new Map(
    (feedbacks ?? []).map((f: { submission_id: string; grade: string | null; text_feedback: string | null }) => [f.submission_id, f])
  )

  // 5. Build display list
  type QRow = {
    id: string; title: string; content: string | null; topic_id: string;
    topics: { id: string; title: string; unit_id: string; units: { id: string; title: string; class_id: string; classes: { id: string; title: string } | null } | null } | null
  }

  const rows = (questions as unknown as QRow[] ?? []).map(q => {
    const topic = q.topics
    const unit = topic?.units
    const cls = unit?.classes
    const sub = submissionByQuestion.get(q.id)
    const fb = sub ? feedbackBySubmission.get(sub.id) : null
    const status: 'not_started' | 'submitted' | 'graded' =
      !sub ? 'not_started' : fb?.grade ? 'graded' : 'submitted'
    const dueDate = dueDateByQuestion.get(q.id) ?? null

    // Build link: /student/[classId]/[unitId]/[topicId]/[questionId]
    const href = cls && unit && topic
      ? `/student/${cls.id}/${unit.id}/${topic.id}/${q.id}`
      : null

    return { q, topic, unit, cls, sub, fb, status, href, dueDate }
  })

  // Sort: not_started first, then submitted, then graded
  const order = { not_started: 0, submitted: 1, graded: 2 }
  rows.sort((a, b) => order[a.status] - order[b.status])

  const notStarted = rows.filter(r => r.status === 'not_started')
  const submitted  = rows.filter(r => r.status === 'submitted')
  const graded     = rows.filter(r => r.status === 'graded')

  function renderRow(r: typeof rows[0]) {
    const gradeInfo = r.fb?.grade ? GRADE_STYLE[r.fb.grade as keyof typeof GRADE_STYLE] : null
    return (
      <div key={r.q.id} className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${
        r.status === 'graded' ? 'border-gray-200' :
        r.status === 'submitted' ? 'border-purple-200' :
        'border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {gradeInfo && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gradeInfo.className}`}>
                  {gradeInfo.label}
                </span>
              )}
              {r.status === 'submitted' && !gradeInfo && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  ⏳ Awaiting feedback
                </span>
              )}
            </div>
            <p className="font-semibold text-gray-800">{r.q.title}</p>
            {r.q.content && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{r.q.content}</p>}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-xs text-gray-400">{r.cls?.title} › {r.unit?.title} › {r.topic?.title}</p>
              {r.dueDate && r.status === 'not_started' && (() => {
                const due = new Date(r.dueDate)
                const now = new Date()
                const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const overdue = daysLeft < 0
                return (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${overdue ? 'bg-red-100 text-red-600' : daysLeft <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {overdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`}
                  </span>
                )
              })()}
            </div>
            {r.fb?.text_feedback && (
              <div className="mt-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                <p className="text-xs text-purple-700 font-medium mb-0.5">Teacher feedback</p>
                <p className="text-sm text-purple-900">{r.fb.text_feedback}</p>
              </div>
            )}
          </div>
          {r.href && (
            <Link
              href={r.href}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                r.status === 'not_started'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {r.status === 'not_started' ? 'Start →' : 'Review →'}
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-purple-900">My Assignments</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> {notStarted.length} to do</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {submitted.length} submitted</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> {graded.length} graded</span>
        </div>
      </div>

      {notStarted.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">To Do ({notStarted.length})</h2>
          <div className="space-y-3">{notStarted.map(renderRow)}</div>
        </section>
      )}

      {submitted.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Submitted — Awaiting Feedback ({submitted.length})</h2>
          <div className="space-y-3">{submitted.map(renderRow)}</div>
        </section>
      )}

      {graded.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Graded ({graded.length})</h2>
          <div className="space-y-3">{graded.map(renderRow)}</div>
        </section>
      )}
    </div>
  )
}
