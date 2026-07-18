import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TeacherWatchBoard from './TeacherWatchBoard'
import Comments from '@/components/Comments'
import AiChatHistory from '@/components/AiChatHistory'
import ZoomableImage from '@/components/ZoomableImage'
import QuestionSwitcher from './QuestionSwitcher'

export const dynamic = 'force-dynamic'

export default async function TeacherWatchPage({
  params,
}: {
  params: Promise<{ classId: string; questionId: string; studentId: string }>
}) {
  const { classId, questionId, studentId } = await params
  const supabase = await createAdminClient()

  const [{ data: question }, { data: student }, { data: cls }, { data: submission }] = await Promise.all([
    supabase.from('questions').select('id, title, content, image_url, answer_key, difficulty, points').eq('id', questionId).single(),
    supabase.from('profiles').select('id, full_name').eq('id', studentId).single(),
    supabase.from('classes').select('title').eq('id', classId).single(),
    supabase.from('submissions')
      .select('id, canvas_data, text_answer, image_url')
      .eq('question_id', questionId)
      .eq('student_id', studentId)
      .maybeSingle(),
  ])

  const { data: feedback } = submission?.id
    ? await supabase.from('feedback').select('grade, text_feedback, canvas_data').eq('submission_id', submission.id).maybeSingle()
    : { data: null }

  const { data: teacherProfile } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher').limit(1).single()

  if (!question || !student) notFound()

  // All questions in this class, with this student's status for each — used
  // by the question switcher so the teacher can jump straight to another
  // question for the SAME student without going back through the class grid.
  const { data: units } = await supabase.from('units').select('id, title, order_index').eq('class_id', classId)
  const unitIds = (units ?? []).map(u => u.id)
  const { data: topics } = unitIds.length > 0
    ? await supabase.from('topics').select('id, title, unit_id, order_index').in('unit_id', unitIds)
    : { data: [] as { id: string; title: string; unit_id: string; order_index: number }[] }
  const topicIds = (topics ?? []).map(t => t.id)
  const { data: classQuestions } = topicIds.length > 0
    ? await supabase.from('questions').select('id, title, topic_id, order_index').in('topic_id', topicIds)
    : { data: [] as { id: string; title: string; topic_id: string; order_index: number }[] }

  const classQuestionIds = (classQuestions ?? []).map(q => q.id)
  const { data: studentSubs } = classQuestionIds.length > 0
    ? await supabase.from('submissions').select('id, question_id').eq('student_id', studentId).in('question_id', classQuestionIds)
    : { data: [] as { id: string; question_id: string }[] }
  const subIdsForStudent = (studentSubs ?? []).map(s => s.id)
  const { data: studentFeedback } = subIdsForStudent.length > 0
    ? await supabase.from('feedback').select('submission_id, grade').in('submission_id', subIdsForStudent)
    : { data: [] as { submission_id: string; grade: string | null }[] }

  const gradedSubIds = new Set((studentFeedback ?? []).filter(f => f.grade).map(f => f.submission_id))
  const subByQuestion = new Map((studentSubs ?? []).map(s => [s.question_id, s.id]))

  const unitOrder = new Map((units ?? []).map(u => [u.id, u.order_index ?? 0]))
  const topicById = new Map((topics ?? []).map(t => [t.id, t]))
  const switcherQuestions = (classQuestions ?? [])
    .map(q => {
      const t = topicById.get(q.topic_id)
      const subId = subByQuestion.get(q.id)
      const status: 'none' | 'submitted' | 'graded' = subId ? (gradedSubIds.has(subId) ? 'graded' : 'submitted') : 'none'
      return {
        id: q.id, title: q.title, topicTitle: t?.title ?? '', status,
        _u: t ? (unitOrder.get(t.unit_id) ?? 0) : 0, _t: t?.order_index ?? 0, _q: q.order_index ?? 0,
      }
    })
    .sort((a, b) => a._u - b._u || a._t - b._t || a._q - b._q)
    .map(({ id, title, topicTitle, status }) => ({ id, title, topicTitle, status }))

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/teacher/live/${classId}/${questionId}`}
            className="text-gray-400 hover:text-white text-sm px-3 py-1.5 bg-gray-800 rounded-lg"
          >
            ← Back to class
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{cls?.title} — {question.title}</p>
              {question.difficulty && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                  question.difficulty === 'easy' ? 'bg-sky-900/60 text-sky-300' : question.difficulty === 'medium' ? 'bg-orange-900/60 text-orange-300' : 'bg-rose-900/60 text-rose-300'
                }`}>
                  {question.difficulty} · {question.points}pt{question.points === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <h1 className="font-bold text-white">{student.full_name}</h1>
          </div>
        </div>
        <span className="text-xs text-green-400 bg-green-900/40 px-3 py-1.5 rounded-full font-medium">● Live</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar: written answer + comments */}
        <div className="w-72 bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col overflow-hidden">
          {/* Written answer */}
          {submission?.text_answer && (
            <div className="p-4 border-b border-gray-800 flex-shrink-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Written Answer</p>
              <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {submission.text_answer}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="flex-shrink-0 overflow-hidden flex flex-col p-4 border-b border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 flex-shrink-0">Comments</p>
            <Comments
              questionId={questionId}
              studentId={studentId}
              currentUserId={teacherProfile?.id ?? ''}
              currentUserName={teacherProfile?.full_name ?? 'Teacher'}
            />
          </div>

          {/* AI Faridah chat — read-only transcript of what the student
              asked and how the AI guided them. */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 flex-shrink-0">🎓 AI Faridah Chat</p>
            <div className="flex-1 min-h-0 bg-gray-800 rounded-lg overflow-hidden">
              <AiChatHistory questionId={questionId} studentId={studentId} />
            </div>
          </div>
        </div>

        {/* Main column: question on top + live whiteboard below */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {/* Question bar — on top, like the student board */}
          <div className="bg-gray-900 border-b border-gray-700 px-5 py-3 flex-shrink-0 max-h-[40%] overflow-y-auto flex gap-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1.5">Question</p>
              <QuestionSwitcher
                classId={classId}
                studentId={studentId}
                questionId={questionId}
                questionTitle={question.title}
                questions={switcherQuestions}
              />
              {question.content && (
                <p className="text-gray-300 text-base mt-2 leading-relaxed whitespace-pre-wrap">{question.content}</p>
              )}
            </div>
            {question.image_url && (
              <ZoomableImage src={question.image_url} alt="Question diagram" className="flex-shrink-0 max-h-56 max-w-[45%] rounded-lg border border-gray-700 object-contain bg-white self-start" />
            )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <TeacherWatchBoard
              classId={classId}
              questionId={questionId}
              studentId={studentId}
              questionTitle={question.title}
              questionContent={question.content ?? null}
              answerKey={question.answer_key ?? null}
              submissionId={submission?.id ?? null}
              initialStudentData={submission?.canvas_data ?? null}
              initialTeacherData={feedback?.canvas_data ?? null}
              initialGrade={feedback?.grade ?? null}
              initialFeedbackText={feedback?.text_feedback ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
