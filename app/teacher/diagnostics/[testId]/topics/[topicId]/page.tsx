import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// Cross-student view of one topic's questions on this test — reached by
// clicking a row in the test dashboard's "Class Struggles" panel. The
// per-attempt page (attempts/[attemptId]) already shows ALL of one
// student's topics; this is the transpose of that: ALL students' work on
// ONE topic, side by side, so a teacher can see exactly what's going wrong
// (and for whom) on a struggling subtopic without opening each attempt.
export default async function DiagnosticTopicDetailPage({
  params,
}: {
  params: Promise<{ testId: string; topicId: string }>
}) {
  const { testId, topicId } = await params
  const admin = await createAdminClient()

  const [{ data: test }, { data: topic }] = await Promise.all([
    admin.from('diagnostic_tests').select('id, title').eq('id', testId).maybeSingle(),
    admin.from('diagnostic_topics').select('id, title, prep_advice').eq('id', topicId).eq('diagnostic_test_id', testId).maybeSingle(),
  ])
  if (!test || !topic) notFound()

  const { data: questions } = await admin
    .from('diagnostic_questions')
    .select('id, content, image_url, mcq_options, mcq_correct_index, question_type, explanation, answer_key, points')
    .eq('diagnostic_test_id', testId)
    .eq('topic_id', topicId)
    .eq('is_active', true)
    .order('created_at')

  const { data: attempts } = await admin
    .from('diagnostic_attempts')
    .select('id, lead_id')
    .eq('diagnostic_test_id', testId)
    .eq('status', 'completed')
    .order('submitted_at', { ascending: true })

  const leadIds = [...new Set((attempts ?? []).map(a => a.lead_id))]
  const { data: leads } = leadIds.length > 0
    ? await admin.from('diagnostic_leads').select('id, student_name').in('id', leadIds)
    : { data: [] as { id: string; student_name: string }[] }
  const studentNameByLead = new Map((leads ?? []).map(l => [l.id, l.student_name]))
  const students = (attempts ?? [])
    .map(a => ({ attemptId: a.id, studentName: studentNameByLead.get(a.lead_id) ?? 'Unknown' }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName))

  const questionIds = (questions ?? []).map(q => q.id)
  const attemptIds = (attempts ?? []).map(a => a.id)
  const { data: answers } = questionIds.length > 0 && attemptIds.length > 0
    ? await admin
        .from('diagnostic_attempt_answers')
        .select('attempt_id, question_id, selected_index, is_correct, canvas_data, points_earned, teacher_annotation')
        .in('question_id', questionIds)
        .in('attempt_id', attemptIds)
    : { data: [] as { attempt_id: string; question_id: string; selected_index: number | null; is_correct: boolean | null; canvas_data: string | null; points_earned: number | null; teacher_annotation: string | null }[] }
  const answerByKey = new Map((answers ?? []).map(a => [`${a.attempt_id}:${a.question_id}`, a]))

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link href={`/teacher/diagnostics/${testId}`} className="text-blue-600 text-sm hover:underline block">← {test.title}</Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs uppercase tracking-widest text-red-500 font-semibold">Topic Detail</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{topic.title}</h1>
        {topic.prep_advice && <p className="text-sm text-gray-500 mt-1">{topic.prep_advice}</p>}
        <p className="text-xs text-gray-400 mt-2">{(questions ?? []).length} question{(questions ?? []).length === 1 ? '' : 's'} · {students.length} student{students.length === 1 ? '' : 's'}</p>
      </div>

      {(!questions || questions.length === 0) && (
        <p className="text-gray-400 text-center py-8">No active questions in this topic on this test.</p>
      )}

      {(questions ?? []).map((q, i) => (
        <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="font-semibold text-gray-800 mb-2">Q{i + 1}. {q.content}</p>
          {q.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.image_url} alt="Question diagram" className="max-h-56 rounded-lg border border-gray-200 mb-3 object-contain bg-white" />
          )}

          {q.question_type === 'mcq' && q.mcq_options && (
            <div className="mb-3 space-y-1">
              {(q.mcq_options as string[]).map((opt, oi) => (
                <div key={oi} className={`text-xs px-2.5 py-1 rounded-lg border ${oi === q.mcq_correct_index ? 'border-green-300 bg-green-50 text-green-800 font-semibold' : 'border-gray-100 text-gray-500'}`}>
                  {oi === q.mcq_correct_index ? '✓ ' : ''}{opt}
                </div>
              ))}
            </div>
          )}
          {q.question_type === 'frq' && q.answer_key && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1">Answer Key</p>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{q.answer_key}</p>
            </div>
          )}

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-4">Student Work</p>
          <div className="space-y-2">
            {students.map(s => {
              const a = answerByKey.get(`${s.attemptId}:${q.id}`)
              return (
                <div key={s.attemptId} className="flex items-start gap-3 border-t border-gray-100 pt-2 first:border-t-0 first:pt-0">
                  <Link href={`/teacher/diagnostics/${testId}/attempts/${s.attemptId}`} className="text-xs font-semibold text-gray-700 hover:text-blue-600 hover:underline w-28 flex-shrink-0 pt-0.5">
                    {s.studentName}
                  </Link>
                  <div className="flex-1 min-w-0">
                    {q.question_type === 'mcq' ? (
                      a && a.selected_index !== null && a.selected_index !== -1 ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {a.is_correct ? '✓' : '✗'} {(q.mcq_options as string[] | null)?.[a.selected_index] ?? `Option ${a.selected_index + 1}`}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Not answered</span>
                      )
                    ) : (
                      a?.canvas_data ? (
                        <div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.teacher_annotation ?? a.canvas_data} alt={`${s.studentName}'s work`} className="max-h-40 rounded-lg border border-gray-200 bg-white" />
                          {a.points_earned !== null && q.points !== null && (
                            <span className="text-xs text-gray-500 mt-1 inline-block">{a.points_earned}/{q.points} pts</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">No work submitted</span>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
