import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import GetHelpButton from '@/components/GetHelpButton'

const GRADE_BADGE: Record<string, { label: string; cls: string }> = {
  correct:   { label: '✓ Correct',   cls: 'bg-green-100 text-green-700' },
  partial:   { label: '~ Partial',   cls: 'bg-amber-100 text-amber-700' },
  incorrect: { label: '✗ Incorrect', cls: 'bg-red-100 text-red-600' },
  discussed: { label: '💬 Discussed', cls: 'bg-blue-100 text-blue-700' },
  needsmore: { label: '🔄 Needs more work', cls: 'bg-purple-100 text-purple-700' },
}

// A consolidated view of everything a student has submitted in this class,
// across every unit/topic — the per-topic pages only ever show one topic at
// a time, so there was previously no single place to see (or ask for help
// on) past work without hunting back through each topic.
export default async function MySubmissionsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const studentId = user.id

  const { data: cls } = await supabase.from('classes').select('id, title').eq('id', classId).single()
  if (!cls) notFound()

  // submissions has no working student SELECT policy under RLS (same as the
  // question detail page) — read via service-role, scoped to this student.
  const admin = await createAdminClient()
  const { data: submissions } = await admin
    .from('submissions')
    .select('id, question_id, canvas_data, text_answer, created_at, updated_at')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })

  const questionIds = [...new Set((submissions ?? []).map(s => s.question_id))]
  const { data: questions } = questionIds.length > 0
    ? await admin.from('questions').select('id, title, topic_id').in('id', questionIds)
    : { data: [] as { id: string; title: string; topic_id: string }[] }
  const questionById = new Map((questions ?? []).map(q => [q.id, q]))

  const topicIds = [...new Set((questions ?? []).map(q => q.topic_id))]
  const { data: topics } = topicIds.length > 0
    ? await admin.from('topics').select('id, title, unit_id').in('id', topicIds)
    : { data: [] as { id: string; title: string; unit_id: string }[] }
  const topicById = new Map((topics ?? []).map(t => [t.id, t]))

  const unitIds = [...new Set((topics ?? []).map(t => t.unit_id))]
  const { data: units } = unitIds.length > 0
    ? await admin.from('units').select('id, title').in('id', unitIds)
    : { data: [] as { id: string; title: string }[] }
  const unitTitleById = new Map((units ?? []).map(u => [u.id, u.title]))

  const submissionIds = (submissions ?? []).map(s => s.id)
  const { data: feedbacks } = submissionIds.length > 0
    ? await admin.from('feedback').select('submission_id, grade, text_feedback').in('submission_id', submissionIds)
    : { data: [] as { submission_id: string; grade: string | null; text_feedback: string | null }[] }
  const feedbackBySubmission = new Map((feedbacks ?? []).map(f => [f.submission_id, f]))

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/student/${classId}`} className="text-purple-600 text-sm hover:underline mb-4 block">← Back to {cls.title}</Link>
      <h1 className="text-2xl font-bold text-purple-900 mb-1">My Submissions</h1>
      <p className="text-sm text-gray-500 mb-6">Everything you've submitted in this class, most recent first.</p>

      {(!submissions || submissions.length === 0) ? (
        <p className="text-gray-500">You haven't submitted anything yet.</p>
      ) : (
        <div className="space-y-2">
          {submissions.map(sub => {
            const question = questionById.get(sub.question_id)
            const topic = question ? topicById.get(question.topic_id) : undefined
            const unitTitle = topic ? unitTitleById.get(topic.unit_id) : undefined
            const fb = feedbackBySubmission.get(sub.id)
            const gradeBadge = fb?.grade ? GRADE_BADGE[fb.grade] : null

            return (
              <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    {question && topic ? (
                      <Link
                        href={`/student/${classId}/${topic.unit_id}/${topic.id}/${question.id}`}
                        className="text-sm font-semibold text-gray-800 hover:text-purple-700 hover:underline"
                      >
                        {question.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400">Question no longer available</p>
                    )}
                    {(unitTitle || topic) && (
                      <p className="text-xs text-gray-400 mt-0.5">{unitTitle}{unitTitle && topic ? ' · ' : ''}{topic?.title}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(sub.updated_at).toLocaleString()}</p>
                    {fb?.text_feedback && (
                      <p className="text-xs text-purple-600 mt-1">Feedback: {fb.text_feedback}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {gradeBadge ? (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${gradeBadge.cls}`}>{gradeBadge.label}</span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">⏳ Awaiting grade</span>
                    )}
                    {question && (
                      <GetHelpButton studentId={studentId} questionId={question.id} classId={classId} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
