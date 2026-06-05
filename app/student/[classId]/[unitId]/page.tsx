import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function UnitPage({ params }: { params: Promise<{ classId: string; unitId: string }> }) {
  const { classId, unitId } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const studentId = session!.user.id

  const [{ data: unit }, { data: cls }, { data: topics }] = await Promise.all([
    supabase.from('units').select('*').eq('id', unitId).single(),
    supabase.from('classes').select('title').eq('id', classId).single(),
    supabase.from('topics').select('*').eq('unit_id', unitId).order('order_index'),
  ])

  if (!unit) notFound()

  const topicIds = topics?.map(t => t.id) ?? []
  const [{ data: allQuestions }, { data: classAssignments }, { data: studentAssignments }] = await Promise.all([
    topicIds.length > 0
      ? supabase.from('questions').select('id, topic_id').in('topic_id', topicIds)
      : Promise.resolve({ data: [] }),
    supabase.from('assignments').select('question_id').eq('class_id', classId),
    supabase.from('student_assignments').select('question_id').eq('student_id', studentId),
  ])
  const assignedIds = new Set([
    ...(classAssignments ?? []).map((a: { question_id: string }) => a.question_id),
    ...(studentAssignments ?? []).map((a: { question_id: string }) => a.question_id),
  ])
  const questions = allQuestions?.filter(q => assignedIds.has(q.id)) ?? []

  const questionIds = questions?.map(q => q.id) ?? []
  const { data: submissions } = questionIds.length > 0
    ? await supabase.from('submissions').select('id, question_id').eq('student_id', studentId).in('question_id', questionIds)
    : { data: [] }

  const submissionIds = submissions?.map(s => s.id) ?? []
  const { data: feedbacks } = submissionIds.length > 0
    ? await supabase.from('feedback').select('grade, submission_id').in('submission_id', submissionIds)
    : { data: [] }

  const submissionByQuestion = new Map(submissions?.map(s => [s.question_id, s.id]))
  const gradeBySubmission = new Map(feedbacks?.map(f => [f.submission_id, f.grade as string | null]))

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/student/${classId}`} className="text-purple-600 text-sm hover:underline mb-4 block">← Back to {cls?.title}</Link>
      <h1 className="text-2xl font-bold text-purple-900 mb-6">{unit.title}</h1>

      <div className="space-y-3">
        {topics?.map((topic, i) => {
          const topicQIds = questions?.filter(q => q.topic_id === topic.id).map(q => q.id) ?? []
          const total = topicQIds.length

          let correct = 0, incorrect = 0, partial = 0, submitted = 0
          for (const qId of topicQIds) {
            const subId = submissionByQuestion.get(qId)
            if (!subId) continue
            submitted++
            const g = gradeBySubmission.get(subId)
            if (g === 'correct') correct++
            else if (g === 'incorrect') incorrect++
            else if (g === 'partial') partial++
          }
          const remaining = total - submitted
          const allDone = total > 0 && submitted === total
          const hasGrades = correct + incorrect + partial > 0

          return (
            <Link
              key={topic.id}
              href={`/student/${classId}/${unitId}/${topic.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-gray-800 group-hover:text-purple-800 transition-colors">{topic.title}</h2>
                    {allDone && !hasGrades && (
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">All submitted</span>
                    )}
                  </div>
                  {topic.description && <p className="text-sm text-gray-500 mt-0.5">{topic.description}</p>}
                  {total > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="flex-1 min-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full transition-all"
                          style={{ width: `${Math.round((submitted / total) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{submitted}/{total}</span>
                      {correct > 0 && <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">✓ {correct}</span>}
                      {partial > 0 && <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">~ {partial}</span>}
                      {incorrect > 0 && <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">✗ {incorrect}</span>}
                      {remaining > 0 && <span className="text-xs text-gray-400">{remaining} left</span>}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
        {!topics?.length && <p className="text-gray-500">No topics yet.</p>}
      </div>
    </div>
  )
}
