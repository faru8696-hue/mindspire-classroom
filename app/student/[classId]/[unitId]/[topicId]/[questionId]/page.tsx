import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Comments from '@/components/Comments'
import StudentBoardPage from './StudentBoardPage'
import AnswerKeyText from '@/components/AnswerKeyText'
import QuestionContent from '@/components/QuestionContent'

export default async function QuestionPage({ params }: { params: Promise<{ classId: string; unitId: string; topicId: string; questionId: string }> }) {
  const { classId, unitId, topicId, questionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const studentId = user.id

  const [{ data: question }, { data: topic }, { data: unit }, { data: cls }, { data: profile }] = await Promise.all([
    supabase.from('questions').select('*').eq('id', questionId).single(),
    supabase.from('topics').select('title').eq('id', topicId).single(),
    supabase.from('units').select('title').eq('id', unitId).single(),
    supabase.from('classes').select('title').eq('id', classId).single(),
    supabase.from('profiles').select('full_name').eq('id', studentId).single(),
  ])

  if (!question) notFound()

  // Build prev/next navigation within this topic's assigned questions
  const [{ data: topicQs }, { data: clsAssign }, { data: stuAssign }] = await Promise.all([
    supabase.from('questions').select('id').eq('topic_id', topicId).order('order_index'),
    supabase.from('assignments').select('question_id').eq('class_id', classId),
    supabase.from('student_assignments').select('question_id').eq('student_id', studentId),
  ])
  const assignedIds = new Set([
    ...(clsAssign ?? []).map((a: { question_id: string }) => a.question_id),
    ...(stuAssign ?? []).map((a: { question_id: string }) => a.question_id),
  ])
  const assignedSeq = (topicQs ?? []).filter(q => assignedIds.has(q.id))
  const seq = assignedSeq.some(q => q.id === questionId) ? assignedSeq : (topicQs ?? [])
  const idx = seq.findIndex(q => q.id === questionId)
  const prevId = idx > 0 ? seq[idx - 1].id : null
  const nextId = idx >= 0 && idx < seq.length - 1 ? seq[idx + 1].id : null
  const position = idx >= 0 ? { current: idx + 1, total: seq.length } : null

  // Read submission + feedback via service-role. The submissions table has no
  // working SELECT policy for students under RLS, so the RLS client returns null
  // — which used to load an empty board and let auto-save overwrite the student's
  // saved work with '[]'. Service-role read (scoped to this student) loads it reliably.
  const admin = await createAdminClient()
  const { data: submission } = await admin
    .from('submissions').select('*').eq('question_id', questionId).eq('student_id', studentId).maybeSingle()

  let feedback = null
  if (submission?.id) {
    const { data: fb } = await admin.from('feedback').select('*').eq('submission_id', submission.id).maybeSingle()
    feedback = fb
  }

  // Answer key is hidden by default — only shown if the teacher has
  // specifically released it to THIS student for THIS question.
  const { data: keyRelease } = await admin
    .from('answer_key_releases')
    .select('id')
    .eq('student_id', studentId)
    .eq('question_id', questionId)
    .maybeSingle()
  const answerKeyReleased = !!keyRelease

  const gradeInfo = feedback?.grade ? ({
    correct:   { label: 'Correct', icon: '✅', cls: 'bg-green-100 text-green-800 border-green-300' },
    partial:   { label: 'Partially correct', icon: '🟡', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
    discussed: { label: 'Discussed', icon: '💬', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
    incorrect: { label: 'Incorrect', icon: '❌', cls: 'bg-red-100 text-red-800 border-red-300' },
    needsmore: { label: 'Needs more work', icon: '🔄', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
  } as Record<string, { label: string; icon: string; cls: string }>)[feedback.grade] : null

  return (
    <div className="max-w-7xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 flex-wrap">
            <Link href={`/student/${classId}`} className="hover:text-purple-600">{cls?.title}</Link>
            <span>›</span>
            <Link href={`/student/${classId}/${unitId}`} className="hover:text-purple-600">{unit?.title}</Link>
            <span>›</span>
            <Link href={`/student/${classId}/${unitId}/${topicId}`} className="hover:text-purple-600">{topic?.title}</Link>
            <span>›</span>
            <span className="text-gray-700 font-medium">{question.title}</span>
          </div>
          <h1 className="text-xl font-bold text-purple-900">{question.title}</h1>
          {question.content && <QuestionContent text={question.content} className="text-gray-600 mt-1" />}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {prevId ? (
              <Link href={`/student/${classId}/${unitId}/${topicId}/${prevId}`}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700 transition-colors">
                ← Prev
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-100 text-gray-300 cursor-not-allowed">← Prev</span>
            )}
            {position && (
              <span className="px-2 text-sm font-medium text-gray-500 whitespace-nowrap">{position.current} / {position.total}</span>
            )}
            {nextId ? (
              <Link href={`/student/${classId}/${unitId}/${topicId}/${nextId}`}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                Next →
              </Link>
            ) : (
              <Link href={`/student/${classId}/${unitId}/${topicId}`}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
                Finish ✓
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Grade banner — clearly shows the student's result for this question */}
      {gradeInfo ? (
        <div className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${gradeInfo.cls}`}>
          <span className="text-2xl">{gradeInfo.icon}</span>
          <div>
            <p className="text-sm font-bold leading-tight">Your grade: {gradeInfo.label}</p>
            {feedback?.text_feedback && <p className="text-sm mt-0.5">{feedback.text_feedback}</p>}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-500">
          <span className="text-2xl">⏳</span>
          <p className="text-sm font-medium">Not graded yet — your teacher will review your work.</p>
        </div>
      )}

      {/* Answer key — only appears once the teacher releases it for this student */}
      {answerKeyReleased && question.answer_key && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-purple-600 mb-2">🔓 Answer Key (released by your teacher)</p>
          <AnswerKeyText text={question.answer_key} className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Board — takes 3/4 width */}
        <div className="lg:col-span-3" style={{ height: 'calc(100vh - 220px)' }}>
          <StudentBoardPage
            questionId={questionId}
            studentId={studentId}
            classId={classId}
            studentName={profile?.full_name ?? 'Student'}
            questionTitle={question.title}
            questionContent={question.content ?? null}
            questionImageUrl={question.image_url ?? null}
            submissionId={submission?.id ?? null}
            initialStudentData={submission?.canvas_data ?? null}
            initialTeacherData={feedback?.canvas_data ?? null}
            initialGrade={feedback?.grade ?? null}
          />
        </div>

        {/* Comments — 1/4 width */}
        <div>
          <Comments
            classId={classId}
            questionId={questionId}
            studentId={studentId}
            currentUserId={studentId}
            currentUserName={profile?.full_name ?? 'Student'}
          />
        </div>
      </div>
    </div>
  )
}
