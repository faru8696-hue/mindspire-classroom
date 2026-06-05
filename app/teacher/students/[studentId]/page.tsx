import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const GRADE: Record<string, { label: string; cls: string }> = {
  correct:   { label: '✓ Correct',   cls: 'bg-green-100 text-green-700' },
  partial:   { label: '~ Partial',   cls: 'bg-amber-100 text-amber-700' },
  incorrect: { label: '✗ Incorrect', cls: 'bg-red-100 text-red-600' },
}

export default async function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const supabase = await createAdminClient()

  // Select core fields first; extended fields (parent_name etc.) added via migration
  const { data: student, error: studentError } = await supabase
    .from('profiles')
    .select('id, full_name, class_id, nickname, avatar_url, grade_level, phone, email')
    .eq('id', studentId)
    .single()
  if (!student || studentError) notFound()

  // Fetch extended fields separately so a missing column never causes a 404
  const { data: extProfile } = await supabase
    .from('profiles')
    .select('parent_name, parent_phone')
    .eq('id', studentId)
    .single()
  const parentName = (extProfile as { parent_name?: string } | null)?.parent_name ?? null
  const parentPhone = (extProfile as { parent_phone?: string } | null)?.parent_phone ?? null

  // Load all enrolled classes for this student
  const { data: studentEnrollments } = await supabase
    .from('class_enrollments')
    .select('class_id, classes(id, title)')
    .eq('student_id', studentId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrolledClasses = (studentEnrollments ?? []).map((e: any) => {
    const c = e.classes
    return Array.isArray(c) ? c[0] : c
  }).filter(Boolean) as { id: string; title: string }[]

  const enrolledClassIds = enrolledClasses.map(c => c.id)

  // Load full content tree for all enrolled classes
  const { data: units } = enrolledClassIds.length > 0
    ? await supabase.from('units').select('id, title, order_index, class_id').in('class_id', enrolledClassIds).order('order_index')
    : { data: [] }

  const unitIds = units?.map(u => u.id) ?? []
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, title, unit_id, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }

  const topicIds = topics?.map(t => t.id) ?? []
  const { data: questions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, title, content, topic_id, order_index').in('topic_id', topicIds).order('order_index')
    : { data: [] }

  const questionIds = questions?.map(q => q.id) ?? []

  // Filter to assigned questions only (across all enrolled classes)
  const { data: assignments } = enrolledClassIds.length > 0 && questionIds.length > 0
    ? await supabase.from('assignments').select('question_id, due_date').in('class_id', enrolledClassIds)
    : { data: [] }
  const assignedSet = assignments && assignments.length > 0
    ? new Set(assignments.map((a: { question_id: string }) => a.question_id))
    : null
  const dueDateMap = new Map(assignments?.map((a: { question_id: string; due_date: string | null }) => [a.question_id, a.due_date]) ?? [])

  // Student's submissions + feedback
  const { data: submissions } = questionIds.length > 0
    ? await supabase.from('submissions').select('id, question_id, created_at, canvas_data').eq('student_id', studentId).in('question_id', questionIds)
    : { data: [] }

  const submissionIds = submissions?.map((s: { id: string }) => s.id) ?? []
  const { data: feedbacks } = submissionIds.length > 0
    ? await supabase.from('feedback').select('submission_id, grade, text_feedback').in('submission_id', submissionIds)
    : { data: [] }

  // Lookups
  const submissionByQuestion = new Map(submissions?.map((s: { question_id: string; id: string; created_at: string }) => [s.question_id, s]))
  const feedbackBySubmission = new Map(feedbacks?.map((f: { submission_id: string; grade: string | null; text_feedback: string | null }) => [f.submission_id, f]))

  // Stats
  const assignedQs = assignedSet ? (questions?.filter(q => assignedSet.has(q.id)) ?? []) : (questions ?? [])
  let totalCorrect = 0, totalIncorrect = 0, totalPartial = 0, totalSubmitted = 0
  for (const q of assignedQs) {
    const sub = submissionByQuestion.get(q.id)
    if (!sub) continue
    totalSubmitted++
    const fb = feedbackBySubmission.get(sub.id)
    if (fb?.grade === 'correct') totalCorrect++
    else if (fb?.grade === 'incorrect') totalIncorrect++
    else if (fb?.grade === 'partial') totalPartial++
  }
  const totalAssigned = assignedQs.length
  const pct = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/teacher/progress" className="text-purple-600 text-sm hover:underline">← All Progress</Link>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-start gap-5">
        {student.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={student.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-600 flex-shrink-0">
            {((student.nickname || student.full_name) ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-8 gap-y-1.5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Name</p>
            <p className="text-sm font-semibold text-gray-900">{student.full_name}</p>
          </div>
          {student.nickname && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Nickname</p>
              <p className="text-sm text-gray-700">{student.nickname}</p>
            </div>
          )}
          {(student as { email?: string }).email && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
              <p className="text-sm text-gray-700">{(student as { email?: string }).email}</p>
            </div>
          )}
          {student.grade_level && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Grade Level</p>
              <p className="text-sm text-gray-700">{student.grade_level}</p>
            </div>
          )}
          {student.phone && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Student Phone</p>
              <p className="text-sm text-gray-700">{student.phone}</p>
            </div>
          )}
          {parentName && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Parent / Guardian</p>
              <p className="text-sm text-gray-700">{parentName}</p>
            </div>
          )}
          {parentPhone && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Parent Phone</p>
              <p className="text-sm text-gray-700">{parentPhone}</p>
            </div>
          )}
          {enrolledClasses.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Class{enrolledClasses.length > 1 ? 'es' : ''}</p>
              <p className="text-sm text-gray-700">{enrolledClasses.map(c => c.title).join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats header */}
      <div>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h1 className="text-2xl font-bold text-purple-900">{student.full_name}</h1>
            {enrolledClasses.length > 0 && <p className="text-sm text-gray-500 mt-0.5">{enrolledClasses.map(c => c.title).join(' · ')}</p>}
          </div>
          <div className="flex gap-3 text-sm flex-shrink-0">
            <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{totalSubmitted}/{totalAssigned} submitted</span>
            {totalCorrect > 0 && <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">✓ {totalCorrect}</span>}
            {totalPartial > 0 && <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-medium">~ {totalPartial}</span>}
            {totalIncorrect > 0 && <span className="bg-red-100 text-red-600 px-3 py-1.5 rounded-full font-medium">✗ {totalIncorrect}</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">{pct}% complete</p>
      </div>

      {/* Units */}
      {(units ?? []).length === 0 && (
        <p className="text-gray-500">No content assigned yet.</p>
      )}

      {(units ?? []).map(unit => {
        const unitTopics = topics?.filter(t => t.unit_id === unit.id) ?? []
        const unitQs = assignedSet
          ? (questions?.filter(q => unitTopics.some(t => t.id === q.topic_id) && assignedSet.has(q.id)) ?? [])
          : (questions?.filter(q => unitTopics.some(t => t.id === q.topic_id)) ?? [])
        if (unitQs.length === 0) return null

        const unitDone = unitQs.filter(q => submissionByQuestion.has(q.id)).length

        return (
          <div key={unit.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Unit header */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">{unit.title}</h2>
              <span className="text-xs text-gray-500">{unitDone}/{unitQs.length} done</span>
            </div>

            {unitTopics.map(topic => {
              const topicQs = assignedSet
                ? (questions?.filter(q => q.topic_id === topic.id && assignedSet.has(q.id)) ?? [])
                : (questions?.filter(q => q.topic_id === topic.id) ?? [])
              if (topicQs.length === 0) return null

              return (
                <div key={topic.id}>
                  <div className="px-5 py-2 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{topic.title}</p>
                  </div>
                  {topicQs.map(q => {
                    const sub = submissionByQuestion.get(q.id) as { id: string; question_id: string; created_at: string; canvas_data: unknown } | undefined
                    const fb = sub ? feedbackBySubmission.get(sub.id) as { submission_id: string; grade: string | null; text_feedback: string | null } | undefined : undefined
                    const grade = fb?.grade ?? null
                    const gradeBadge = grade ? GRADE[grade] : null
                    const dueDate = dueDateMap.get(q.id)

                    return (
                      <div
                        key={q.id}
                        className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Status dot */}
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          grade === 'correct'   ? 'bg-green-500' :
                          grade === 'incorrect' ? 'bg-red-400' :
                          grade === 'partial'   ? 'bg-amber-400' :
                          sub                   ? 'bg-blue-400' :
                                                  'bg-gray-200'
                        }`} />

                        {/* Question info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/teacher/questions/${q.id}`} className="text-sm font-medium text-gray-800 hover:text-purple-700 hover:underline truncate block">{q.title}</Link>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {dueDate && (
                              <span className="text-xs text-gray-400">Due {new Date(dueDate).toLocaleDateString()}</span>
                            )}
                            {sub && (
                              <span className="text-xs text-gray-400">
                                Submitted {new Date(sub.created_at).toLocaleDateString()}
                              </span>
                            )}
                            {fb?.text_feedback && (
                              <span className="text-xs text-purple-600 truncate max-w-[200px]" title={fb.text_feedback}>
                                Feedback: {fb.text_feedback}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Grade / status */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {gradeBadge ? (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${gradeBadge.cls}`}>
                              {gradeBadge.label}
                            </span>
                          ) : sub ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Submitted</span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Not done</span>
                          )}

                          {/* View submission link */}
                          {sub && (
                            <Link
                              href={`/teacher/submissions?student=${studentId}&question=${q.id}`}
                              className="text-xs text-purple-600 hover:underline"
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
