import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

const GRADE_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  correct:   { label: '✓ Correct',   cls: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  partial:   { label: '~ Partial',   cls: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400' },
  incorrect: { label: '✗ Incorrect', cls: 'bg-red-100 text-red-600',      dot: 'bg-red-500' },
}

export default async function TopicPage({ params }: { params: Promise<{ classId: string; unitId: string; topicId: string }> }) {
  const { classId, unitId, topicId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const studentId = user.id

  const [{ data: topic }, { data: unit }, { data: allQuestions }, { data: classRow }] = await Promise.all([
    supabase.from('topics').select('*').eq('id', topicId).single(),
    supabase.from('units').select('title').eq('id', unitId).single(),
    supabase.from('questions').select('*').eq('topic_id', topicId).order('order_index'),
    supabase.from('classes').select('id').eq('id', classId).single(),
  ])

  // Show union of class-level and student-level assignments; if neither exists show all
  const [{ data: classAssignments }, { data: studentAssignments }] = await Promise.all([
    supabase.from('assignments').select('question_id').eq('class_id', classId),
    supabase.from('student_assignments').select('question_id').eq('student_id', studentId),
  ])
  const assignedIds = new Set([
    ...(classAssignments ?? []).map((a: { question_id: string }) => a.question_id),
    ...(studentAssignments ?? []).map((a: { question_id: string }) => a.question_id),
  ])
  const questions = allQuestions?.filter(q => assignedIds.has(q.id)) ?? []

  if (!topic) notFound()

  const questionIds = questions?.map(q => q.id) ?? []
  const { data: submissions } = questionIds.length > 0
    ? await supabase.from('submissions').select('id, question_id').eq('student_id', studentId).in('question_id', questionIds)
    : { data: [] }

  const submissionIds = submissions?.map(s => s.id) ?? []
  const { data: feedbacks } = submissionIds.length > 0
    ? await supabase.from('feedback').select('grade, submission_id').in('submission_id', submissionIds)
    : { data: [] }

  // Map: questionId → grade (or null if submitted but not yet graded)
  const submissionByQuestion = new Map(submissions?.map(s => [s.question_id, s.id]))
  const gradeBySubmission = new Map(feedbacks?.map(f => [f.submission_id, f.grade as string | null]))

  const total = questionIds.length
  const submitted = submissions?.length ?? 0
  const correct = feedbacks?.filter(f => f.grade === 'correct').length ?? 0
  const incorrect = feedbacks?.filter(f => f.grade === 'incorrect').length ?? 0
  const partial = feedbacks?.filter(f => f.grade === 'partial').length ?? 0

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/student/${classId}/${unitId}`} className="text-purple-600 text-sm hover:underline mb-4 block">← Back to {unit?.title}</Link>
      <h1 className="text-2xl font-bold text-purple-900 mb-2">{topic.title}</h1>

      {/* Topic stats */}
      {total > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{submitted}/{total} submitted</span>
          {correct > 0 && <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ {correct} correct</span>}
          {partial > 0 && <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">~ {partial} partial</span>}
          {incorrect > 0 && <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">✗ {incorrect} incorrect</span>}
          {submitted < total && <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{total - submitted} remaining</span>}
        </div>
      )}

      <div className="space-y-3">
        {questions?.map((q, i) => {
          const subId = submissionByQuestion.get(q.id)
          const done = !!subId
          const grade = subId ? gradeBySubmission.get(subId) ?? null : null
          const gradeBadge = grade ? GRADE_BADGE[grade] : null

          return (
            <Link
              key={q.id}
              href={`/student/${classId}/${unitId}/${topicId}/${q.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-sm flex-shrink-0 ${
                  grade === 'correct'   ? 'bg-green-100 text-green-700' :
                  grade === 'incorrect' ? 'bg-red-100 text-red-600' :
                  grade === 'partial'   ? 'bg-amber-100 text-amber-700' :
                  done                  ? 'bg-blue-100 text-blue-700' :
                                          'bg-purple-100 text-purple-700 group-hover:bg-purple-200'
                }`}>
                  {grade === 'correct' ? '✓' : grade === 'incorrect' ? '✗' : grade === 'partial' ? '~' : done ? '●' : i + 1}
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-800 group-hover:text-purple-800 transition-colors">{q.title}</h2>
                  {q.content && <p className="text-sm text-gray-500 mt-0.5">{q.content}</p>}
                </div>
                {gradeBadge ? (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${gradeBadge.cls}`}>
                    {gradeBadge.label}
                  </span>
                ) : done ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700 flex-shrink-0">Submitted</span>
                ) : null}
              </div>
            </Link>
          )
        })}
        {!questions?.length && <p className="text-gray-500">No questions yet.</p>}
      </div>
    </div>
  )
}
