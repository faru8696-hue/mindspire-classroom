import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TeacherWatchBoard from './TeacherWatchBoard'
import Comments from '@/components/Comments'

export default async function TeacherWatchPage({
  params,
}: {
  params: Promise<{ classId: string; questionId: string; studentId: string }>
}) {
  const { classId, questionId, studentId } = await params
  const supabase = await createAdminClient()

  const [{ data: question }, { data: student }, { data: cls }, { data: submission }] = await Promise.all([
    supabase.from('questions').select('id, title, content').eq('id', questionId).single(),
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
            <p className="text-xs text-gray-500">{cls?.title} — {question.title}</p>
            <h1 className="font-bold text-white">{student.full_name}</h1>
          </div>
        </div>
        <span className="text-xs text-green-400 bg-green-900/40 px-3 py-1.5 rounded-full font-medium">● Live</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar: question + written answer + comments */}
        <div className="w-72 bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col overflow-hidden">
          {/* Question */}
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Question</p>
            <h2 className="text-white font-semibold text-sm leading-relaxed">{question.title}</h2>
            {question.content && (
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{question.content}</p>
            )}
          </div>

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
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 flex-shrink-0">Comments</p>
            <div className="flex-1 min-h-0">
              <Comments
                questionId={questionId}
                studentId={studentId}
                currentUserId={teacherProfile?.id ?? ''}
                currentUserName={teacherProfile?.full_name ?? 'Teacher'}
              />
            </div>
          </div>
        </div>

        {/* Live whiteboard + grading */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <TeacherWatchBoard
            classId={classId}
            questionId={questionId}
            studentId={studentId}
            submissionId={submission?.id ?? null}
            initialStudentData={submission?.canvas_data ?? null}
            initialGrade={feedback?.grade ?? null}
            initialFeedbackText={feedback?.text_feedback ?? null}
          />
        </div>
      </div>
    </div>
  )
}
