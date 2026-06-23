'use client'

import { useState, useEffect, useMemo } from 'react'
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
  questions: { title: string; content: string | null; topics: { title: string; units: { title: string; classes: { id: string; title: string } | null } | null } | null } | null
  feedback: { id: string; text_feedback: string | null; canvas_data: string | null; grade: string | null } | null
}

const GRADES = {
  correct: { label: '✓ Correct', active: 'bg-green-600 text-white', idle: 'bg-gray-100 text-gray-600', badge: 'bg-green-100 text-green-700' },
  partial: { label: '~ Partial', active: 'bg-amber-500 text-white', idle: 'bg-gray-100 text-gray-600', badge: 'bg-amber-100 text-amber-700' },
  incorrect: { label: '✗ Wrong', active: 'bg-red-600 text-white', idle: 'bg-gray-100 text-gray-600', badge: 'bg-red-100 text-red-700' },
}

function classOf(s: Submission) {
  return s.questions?.topics?.units?.classes ?? null
}

export default function SubmissionsPage() {
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  // Drill-down state: class → student → work (submission)
  const [classId, setClassId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
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
      .select(`*, profiles(full_name, email), questions(title, content, topics(title, units(title, classes(id, title)))), feedback(id, text_feedback, canvas_data, grade)`)
      .order('updated_at', { ascending: false })
    setSubmissions((data as unknown as Submission[]) ?? [])
  }

  // ── Grouping for the drill-down ──────────────────────────────────
  const classes = useMemo(() => {
    const map = new Map<string, { id: string; title: string; subs: Submission[] }>()
    for (const s of submissions) {
      const c = classOf(s)
      const id = c?.id ?? 'other'
      const title = c?.title ?? 'Other'
      if (!map.has(id)) map.set(id, { id, title, subs: [] })
      map.get(id)!.subs.push(s)
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title))
  }, [submissions])

  const students = useMemo(() => {
    const cls = classes.find(c => c.id === classId)
    if (!cls) return []
    const map = new Map<string, { id: string; name: string; subs: Submission[] }>()
    for (const s of cls.subs) {
      if (!map.has(s.student_id)) map.set(s.student_id, { id: s.student_id, name: s.profiles?.full_name ?? 'Unknown', subs: [] })
      map.get(s.student_id)!.subs.push(s)
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [classes, classId])

  const works = useMemo(() => students.find(st => st.id === studentId)?.subs ?? [], [students, studentId])

  const ungraded = (subs: Submission[]) => subs.filter(s => !s.feedback?.grade).length

  function openClass(id: string) { setClassId(id); setStudentId(null); setSelected(null) }
  function openStudent(id: string) { setStudentId(id); setSelected(null) }
  function openWork(sub: Submission) {
    setSelected(sub)
    setGrade(sub.feedback?.grade ?? null)
    setTextFeedback(sub.feedback?.text_feedback ?? '')
  }

  // Keep `selected` in sync after a reload (e.g. grade saved) so its feedback is fresh
  useEffect(() => {
    if (!selected) return
    const fresh = submissions.find(s => s.id === selected.id)
    if (fresh && fresh !== selected) setSelected(fresh)
  }, [submissions]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveTeacherAnnotation(submissionId: string, canvasData: string) {
    if (!currentUser) return
    const { data: ex } = await supabase.from('feedback').select('id').eq('submission_id', submissionId).single()
    if (ex) {
      await supabase.from('feedback').update({ canvas_data: canvasData, updated_at: new Date().toISOString() }).eq('submission_id', submissionId)
    } else {
      await supabase.from('feedback').insert({ submission_id: submissionId, teacher_id: currentUser.id, canvas_data: canvasData })
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

  const activeClass = classes.find(c => c.id === classId)
  const activeStudent = students.find(st => st.id === studentId)

  return (
    <div className="max-w-full flex gap-3 h-[calc(100vh-120px)]">
      {/* Drill-down navigator */}
      <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-y-auto flex flex-col">
        {/* Breadcrumb */}
        <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
            <button onClick={() => { setClassId(null); setStudentId(null); setSelected(null) }}
              className={`hover:text-purple-600 ${!classId ? 'font-bold text-purple-700' : ''}`}>Classes</button>
            {activeClass && (<>
              <span>›</span>
              <button onClick={() => openClass(activeClass.id)}
                className={`hover:text-purple-600 truncate max-w-[90px] ${classId && !studentId ? 'font-bold text-purple-700' : ''}`}>{activeClass.title}</button>
            </>)}
            {activeStudent && (<>
              <span>›</span>
              <span className="font-bold text-purple-700 truncate max-w-[90px]">{activeStudent.name}</span>
            </>)}
          </div>
        </div>

        {/* Level: Classes */}
        {!classId && (
          <div>
            <p className="px-3 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">Classes ({classes.length})</p>
            {classes.map(c => (
              <button key={c.id} onClick={() => openClass(c.id)}
                className="w-full text-left p-3 hover:bg-purple-50 transition-colors border-b border-gray-50 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800 truncate">📁 {c.title}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  {ungraded(c.subs) > 0 && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">{ungraded(c.subs)} new</span>}
                  {c.subs.length}
                </span>
              </button>
            ))}
            {classes.length === 0 && <p className="p-3 text-sm text-gray-400">No submissions yet.</p>}
          </div>
        )}

        {/* Level: Students */}
        {classId && !studentId && (
          <div>
            <p className="px-3 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">Students ({students.length})</p>
            {students.map(st => (
              <button key={st.id} onClick={() => openStudent(st.id)}
                className="w-full text-left p-3 hover:bg-purple-50 transition-colors border-b border-gray-50 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800 truncate">👤 {st.name}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  {ungraded(st.subs) > 0 && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">{ungraded(st.subs)} new</span>}
                  {st.subs.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Level: Works */}
        {classId && studentId && (
          <div>
            <p className="px-3 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">Submitted work ({works.length})</p>
            {works.map(sub => (
              <button key={sub.id} onClick={() => openWork(sub)}
                className={`w-full text-left p-3 hover:bg-purple-50 transition-colors border-b border-gray-50 ${selected?.id === sub.id ? 'bg-purple-50 border-l-2 border-purple-500' : ''}`}>
                <p className="font-semibold text-sm text-gray-800 truncate">{sub.questions?.title}</p>
                <p className="text-xs text-gray-400 truncate">{sub.questions?.topics?.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {sub.feedback?.grade ? (
                    <span className={`text-xs px-1.5 py-0.5 rounded inline-block font-medium ${GRADES[sub.feedback.grade as keyof typeof GRADES]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
                      {GRADES[sub.feedback.grade as keyof typeof GRADES]?.label ?? sub.feedback.grade}
                    </span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded inline-block font-medium bg-gray-100 text-gray-500">Not graded</span>
                  )}
                  <span className="text-xs text-gray-300">{new Date(sub.updated_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
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
          <p className="text-gray-400">
            {!classId ? 'Pick a class to begin' : !studentId ? 'Pick a student' : 'Pick a submitted work to review'}
          </p>
        </div>
      )}
    </div>
  )
}
