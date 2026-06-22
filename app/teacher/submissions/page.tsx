'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Comments from '@/components/Comments'
import InfiniteWhiteboard from '@/components/InfiniteWhiteboard'

interface Submission {
  id: string
  canvas_data: string | null
  text_answer: string | null
  updated_at: string
  student_id: string
  question_id: string
  profiles: { full_name: string; email: string } | null
  questions: { title: string; content: string | null; topics: { title: string; units: { title: string } | null } | null } | null
  feedback: { id: string; text_feedback: string | null; canvas_data: string | null; grade: string | null } | null
}

const GRADES = {
  correct: { label: '✓ Correct', active: 'bg-green-600 text-white', idle: 'bg-gray-100 text-gray-600', badge: 'bg-green-100 text-green-700' },
  partial: { label: '~ Partial', active: 'bg-amber-500 text-white', idle: 'bg-gray-100 text-gray-600', badge: 'bg-amber-100 text-amber-700' },
  incorrect: { label: '✗ Wrong', active: 'bg-red-600 text-white', idle: 'bg-gray-100 text-gray-600', badge: 'bg-red-100 text-red-700' },
}

export default function SubmissionsPage() {
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selected, setSelected] = useState<Submission | null>(null)
  const [grade, setGrade] = useState<string | null>(null)
  const [textFeedback, setTextFeedback] = useState('')
  const [grading, setGrading] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => setCurrentUser({ id: user.id, name: data?.full_name ?? 'Teacher' }))
    })
  }, [])

  async function load() {
    const { data } = await supabase
      .from('submissions')
      .select(`*, profiles(full_name, email), questions(title, content, topics(title, units(title))), feedback(id, text_feedback, canvas_data, grade)`)
      .order('updated_at', { ascending: false })
    setSubmissions((data as unknown as Submission[]) ?? [])
  }

  function select(sub: Submission) {
    setSelected(sub)
    setGrade(sub.feedback?.grade ?? null)
    setTextFeedback(sub.feedback?.text_feedback ?? '')
  }

  // Bound to a specific submission id so the unmount flush always writes to the
  // submission the board belonged to — not whichever one is selected now.
  async function saveTeacherAnnotation(submissionId: string, canvasData: string) {
    if (!currentUser) return
    const { data: ex } = await supabase.from('feedback').select('id').eq('submission_id', submissionId).single()
    if (ex) {
      await supabase.from('feedback').update({
        canvas_data: canvasData,
        updated_at: new Date().toISOString(),
      }).eq('submission_id', submissionId)
    } else {
      await supabase.from('feedback').insert({
        submission_id: submissionId,
        teacher_id: currentUser.id,
        canvas_data: canvasData,
      })
    }
    load()
  }

  async function saveGrade() {
    if (!selected || !currentUser) return
    setGrading(true)
    const { data: ex } = await supabase.from('feedback').select('id').eq('submission_id', selected.id).single()
    if (ex) {
      await supabase.from('feedback').update({ grade, text_feedback: textFeedback, updated_at: new Date().toISOString() }).eq('submission_id', selected.id)
    } else {
      await supabase.from('feedback').insert({ submission_id: selected.id, teacher_id: currentUser.id, grade, text_feedback: textFeedback })
    }
    setGrading(false)
    load()
  }

  return (
    <div className="max-w-full flex gap-3 h-[calc(100vh-120px)]">
      {/* Student list */}
      <div className="w-60 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-y-auto">
        <div className="p-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-sm">Submissions ({submissions.length})</h2>
        </div>
        {submissions.map(sub => (
          <button key={sub.id} onClick={() => select(sub)}
            className={`w-full text-left p-3 hover:bg-purple-50 transition-colors border-b border-gray-50 ${selected?.id === sub.id ? 'bg-purple-50 border-l-2 border-purple-500' : ''}`}>
            <p className="font-semibold text-sm text-gray-800">{sub.profiles?.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{sub.questions?.title}</p>
            {sub.feedback?.grade && (
              <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block font-medium ${GRADES[sub.feedback.grade as keyof typeof GRADES]?.badge}`}>
                {GRADES[sub.feedback.grade as keyof typeof GRADES]?.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main area */}
      {selected ? (
        <div className="flex-1 flex gap-3 overflow-hidden min-w-0">
          {/* Board */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-purple-900">{selected.profiles?.full_name}</p>
                  <p className="text-xs text-gray-500">{selected.questions?.topics?.units?.title} → {selected.questions?.topics?.title} → {selected.questions?.title}</p>
                  {selected.text_answer && <p className="text-xs text-gray-600 mt-1 bg-gray-50 px-2 py-1 rounded">📝 {selected.text_answer}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(Object.entries(GRADES) as [string, typeof GRADES.correct][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => setGrade(grade === key ? null : key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${grade === key ? cfg.active : cfg.idle + ' hover:bg-gray-200'}`}>
                      {cfg.label}
                    </button>
                  ))}
                  <input
                    value={textFeedback}
                    onChange={e => setTextFeedback(e.target.value)}
                    placeholder="Written feedback..."
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 w-48"
                  />
                  <button onClick={saveGrade} disabled={grading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50">
                    {grading ? '...' : 'Save Grade'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <InfiniteWhiteboard
                key={selected.id}
                questionId={selected.question_id}
                studentId={selected.student_id}
                role="teacher"
                initialStudentData={selected.canvas_data}
                initialTeacherData={selected.feedback?.canvas_data ?? null}
                onSaveTeacher={(data) => saveTeacherAnnotation(selected.id, data)}
              />
            </div>
          </div>

          {/* Comments */}
          <div className="w-64 flex-shrink-0">
            {currentUser && (
              <Comments
                questionId={selected.question_id}
                studentId={selected.student_id}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
          <p className="text-gray-400">Select a student to review their board</p>
        </div>
      )}
    </div>
  )
}
