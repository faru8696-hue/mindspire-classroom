import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GetHelpButton from '@/components/GetHelpButton'
import { GRADE_MAP } from '@/lib/grades'

// Cross-class version of the per-class "My Submissions" page — the only
// entry point to that one was a small link buried inside each class's own
// detail page, so a student had no single obvious place to go review past
// work across everything they're enrolled in. This is the one linked
// directly from the main nav. Defaults to a "Needs Review" filter (anything
// not a plain, feedback-free "Correct") so a student can find what to look
// back at without scrolling past every already-correct answer first.
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter: filterParam } = await searchParams
  const filter = filterParam === 'all' ? 'all' : 'review'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const studentId = user.id

  // submissions has no working student SELECT policy under RLS — read via
  // service-role, scoped to this student (same pattern as the per-class page).
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
    ? await admin.from('units').select('id, title, class_id').in('id', unitIds)
    : { data: [] as { id: string; title: string; class_id: string }[] }
  const unitById = new Map((units ?? []).map(u => [u.id, u]))

  const classIds = [...new Set((units ?? []).map(u => u.class_id))]
  const { data: classes } = classIds.length > 0
    ? await admin.from('classes').select('id, title').in('id', classIds)
    : { data: [] as { id: string; title: string }[] }
  const classById = new Map((classes ?? []).map(c => [c.id, c]))

  const submissionIds = (submissions ?? []).map(s => s.id)
  const { data: feedbacks } = submissionIds.length > 0
    ? await admin.from('feedback').select('submission_id, grade, text_feedback').in('submission_id', submissionIds)
    : { data: [] as { submission_id: string; grade: string | null; text_feedback: string | null }[] }
  const feedbackBySubmission = new Map((feedbacks ?? []).map(f => [f.submission_id, f]))

  // Comment counts per question — cheap enough to fetch in one batch and
  // lets the list flag "there's a conversation here" without rendering the
  // full (realtime-channel-heavy) Comments component once per row.
  const { data: comments } = questionIds.length > 0
    ? await admin.from('comments').select('question_id').eq('student_id', studentId).in('question_id', questionIds)
    : { data: [] as { question_id: string }[] }
  const commentCountByQuestion = new Map<string, number>()
  for (const c of comments ?? []) commentCountByQuestion.set(c.question_id, (commentCountByQuestion.get(c.question_id) ?? 0) + 1)

  const rows = (submissions ?? []).map(sub => {
    const question = questionById.get(sub.question_id)
    const topic = question ? topicById.get(question.topic_id) : undefined
    const unit = topic ? unitById.get(topic.unit_id) : undefined
    const cls = unit ? classById.get(unit.class_id) : undefined
    const fb = feedbackBySubmission.get(sub.id)
    const gradeDef = fb?.grade ? GRADE_MAP[fb.grade] : undefined
    const commentCount = question ? commentCountByQuestion.get(question.id) ?? 0 : 0
    // "Needs review" = anything with actual feedback to look at — wrong or
    // incomplete work, any left-behind comment note, or free-text feedback
    // even on an otherwise-correct answer (a teacher's "nice work, but
    // next time show X" shouldn't be invisible just because the grade
    // itself was correct).
    const needsReview = (gradeDef && gradeDef.value !== 'correct') || !!fb?.text_feedback || commentCount > 0
    return { sub, question, topic, unit, cls, fb, gradeDef, commentCount, needsReview }
  })
  const reviewCount = rows.filter(r => r.needsReview).length
  const visibleRows = filter === 'review' ? rows.filter(r => r.needsReview) : rows

  // Grade-value counts for the summary strip — collapsed through GRADE_MAP
  // so legacy grade strings (partial/discussed/needsmore) land in the
  // right bucket alongside the current correct/incorrect/incomplete set.
  const correctCount = rows.filter(r => r.gradeDef?.value === 'correct').length
  const wrongCount = rows.filter(r => r.gradeDef?.value === 'incorrect').length
  const incompleteCount = rows.filter(r => r.gradeDef?.value === 'incomplete').length
  const awaitingCount = rows.filter(r => !r.gradeDef).length

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-1">Review</h1>
      <p className="text-sm text-gray-500 mb-4">Everything you&rsquo;ve submitted across all your classes, most recent first.</p>

      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-2xl font-black text-green-600">{correctCount}</div>
            <div className="text-xs text-gray-500 font-medium">✓ Correct</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-2xl font-black text-red-600">{wrongCount}</div>
            <div className="text-xs text-gray-500 font-medium">✗ Wrong</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-2xl font-black text-amber-600">{incompleteCount}</div>
            <div className="text-xs text-gray-500 font-medium">… Incomplete</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-2xl font-black text-blue-600">{awaitingCount}</div>
            <div className="text-xs text-gray-500 font-medium">⏳ Awaiting grade</div>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        <Link
          href="/student/review?filter=review"
          className={`text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${filter === 'review' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Needs Review ({reviewCount})
        </Link>
        <Link
          href="/student/review?filter=all"
          className={`text-sm font-semibold px-3 py-1.5 rounded-md transition-colors ${filter === 'all' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All ({rows.length})
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">You haven&rsquo;t submitted anything yet.</p>
      ) : visibleRows.length === 0 ? (
        <p className="text-gray-500">Nothing needs review right now — nice work! 🎉</p>
      ) : (
        <div className="space-y-2">
          {visibleRows.map(({ sub, question, topic, unit, cls, fb, gradeDef, commentCount }) => (
            <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  {question && topic && unit && cls ? (
                    <Link
                      href={`/student/${cls.id}/${unit.id}/${topic.id}/${question.id}`}
                      className="text-sm font-semibold text-gray-800 hover:text-purple-700 hover:underline"
                    >
                      {question.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-gray-400">Question no longer available</p>
                  )}
                  {(cls || topic) && (
                    <p className="text-xs text-gray-400 mt-0.5">{cls?.title}{cls && topic ? ' · ' : ''}{topic?.title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(sub.updated_at).toLocaleString()}</p>
                  {fb?.text_feedback && (
                    <p className="text-xs text-purple-600 mt-1">Feedback: {fb.text_feedback}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {commentCount > 0 && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">💬 {commentCount}</span>
                  )}
                  {gradeDef ? (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${gradeDef.badge}`}>{gradeDef.icon} {gradeDef.label}</span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">⏳ Awaiting grade</span>
                  )}
                  {question && cls && (
                    <GetHelpButton studentId={studentId} questionId={question.id} classId={cls.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
