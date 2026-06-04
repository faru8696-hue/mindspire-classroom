import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TeacherWatchBoard from './TeacherWatchBoard'

export default async function TeacherWatchPage({
  params,
}: {
  params: Promise<{ classId: string; questionId: string; studentId: string }>
}) {
  const { classId, questionId, studentId } = await params
  const supabase = await createAdminClient()

  const [{ data: question }, { data: student }, { data: cls }, { data: submission }] = await Promise.all([
    supabase.from('questions').select('id, title, content, topic_id, topics(title, unit_id, units(title))').eq('id', questionId).single(),
    supabase.from('profiles').select('id, full_name').eq('id', studentId).single(),
    supabase.from('classes').select('title').eq('id', classId).single(),
    supabase.from('submissions').select('canvas_data, text_answer').eq('question_id', questionId).eq('student_id', studentId).maybeSingle(),
  ])

  if (!question || !student) notFound()

  const topic = (question.topics as unknown as { title: string; unit_id: string; units: { title: string } | null } | null)
  const unit = topic?.units

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
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {cls?.title && <span>{cls.title}</span>}
              {unit?.title && <><span>›</span><span>{unit.title}</span></>}
              {topic?.title && <><span>›</span><span>{topic.title}</span></>}
            </div>
            <h1 className="font-bold text-white">{student.full_name} — {question.title}</h1>
          </div>
        </div>
        <span className="text-xs text-green-400 bg-green-900/40 px-3 py-1.5 rounded-full">● Live</span>
      </div>

      {/* Question + Board split */}
      <div className="flex flex-1 min-h-0">
        {/* Question panel */}
        <div className="w-72 bg-gray-900 border-r border-gray-700 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Question</p>
            <h2 className="text-white font-semibold text-sm">{question.title}</h2>
            {question.content && (
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{question.content}</p>
            )}
          </div>

          {/* Student text answer if any */}
          {submission?.text_answer && (
            <div className="p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Student&apos;s Written Answer</p>
              <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap">
                {submission.text_answer}
              </div>
            </div>
          )}
        </div>

        {/* Live whiteboard */}
        <div className="flex-1 min-w-0">
          <TeacherWatchBoard
            questionId={questionId}
            studentId={studentId}
            initialStudentData={submission?.canvas_data ?? null}
          />
        </div>
      </div>
    </div>
  )
}
