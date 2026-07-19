'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Comments from '@/components/Comments'
import AiChatHistory from '@/components/AiChatHistory'
import InfiniteWhiteboard, { InfiniteWhiteboardHandle } from '@/components/InfiniteWhiteboard'
import ZoomableImage from '@/components/ZoomableImage'
import { GRADE_LIST, GRADE_MAP } from '@/lib/grades'
import { renderBoardSnapshot } from '@/lib/renderBoardSnapshot'
import AnswerKeyPanel from '@/components/AnswerKeyPanel'

interface Submission {
  id: string
  canvas_data: string | null
  text_answer: string | null
  updated_at: string
  student_id: string
  question_id: string
  profiles: { full_name: string; email: string } | null
  questions: { title: string; content: string | null; image_url: string | null; answer_key: string | null; difficulty: string | null; points: number | null; topics: { title: string; units: { title: string; classes: { id: string; title: string } | null } | null } | null } | null
  feedback: { id: string; text_feedback: string | null; canvas_data: string | null; grade: string | null } | null
}

function classOf(s: Submission) {
  return s.questions?.topics?.units?.classes ?? null
}

export default function SubmissionsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  // Drill-down state: class → student → work (submission)
  const [classId, setClassId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Submission | null>(null)
  const [grade, setGrade] = useState<string | null>(null)
  const [textFeedback, setTextFeedback] = useState('')
  const [grading, setGrading] = useState(false)
  const [questionCollapsed, setQuestionCollapsed] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)
  const boardRef = useRef<InfiniteWhiteboardHandle>(null)
  const [aiChecking, setAiChecking] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{ grade: 'correct' | 'incorrect'; feedback: string } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Class-wide "AI Check All Pending" — checks every ungraded submission
  // across the whole class in one click, instead of the teacher opening
  // each question/student individually. Keyed by submission id so results
  // persist as the teacher reviews them one at a time.
  const [classAiResults, setClassAiResults] = useState<Map<string, {
    loading: boolean; grade?: 'correct' | 'incorrect'; feedback?: string; error?: string; approved?: boolean
  }>>(new Map())
  const [classAiRunning, setClassAiRunning] = useState(false)
  const [classAiProgress, setClassAiProgress] = useState<{ done: number; total: number } | null>(null)

  // Per-student answer key releases — "studentId:questionId" -> released.
  const [keyReleases, setKeyReleases] = useState<Set<string>>(new Set())
  const [releasingKey, setReleasingKey] = useState(false)
  const releaseKeyFor = (studentId: string, questionId: string) => `${studentId}:${questionId}`
  const isKeyReleased = (studentId: string, questionId: string) => keyReleases.has(releaseKeyFor(studentId, questionId))

  useEffect(() => {
    load()
    loadKeyReleases()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => setCurrentUser({ id: user.id, name: data?.full_name ?? 'Teacher' }))
    })
  }, [])

  // Patches one submission's feedback in local state instead of refetching
  // the ENTIRE submissions list (every class, every student, with deep
  // joins) after every single grade save — that full reload was the actual
  // source of the lag, not the grade write itself.
  function patchFeedbackLocal(submissionId: string, patch: Partial<NonNullable<Submission['feedback']>>) {
    setSubmissions(prev => prev.map(s => s.id === submissionId
      ? { ...s, feedback: { id: s.feedback?.id ?? submissionId, text_feedback: null, canvas_data: null, grade: null, ...s.feedback, ...patch } }
      : s
    ))
  }

  async function load() {
    const { data } = await supabase
      .from('submissions')
      .select(`*, profiles(full_name, email), questions(title, content, image_url, answer_key, difficulty, points, topics(title, units(title, classes(id, title)))), feedback(id, text_feedback, canvas_data, grade)`)
      .order('updated_at', { ascending: false })
    setSubmissions((data as unknown as Submission[]) ?? [])
  }

  async function loadKeyReleases() {
    const { data } = await supabase.from('answer_key_releases').select('student_id, question_id')
    setKeyReleases(new Set((data ?? []).map(r => releaseKeyFor(r.student_id, r.question_id))))
  }

  async function toggleAnswerKeyRelease(studentId: string, questionId: string) {
    const key = releaseKeyFor(studentId, questionId)
    const nextReleased = !keyReleases.has(key)
    setReleasingKey(true)
    setKeyReleases(prev => {
      const next = new Set(prev)
      if (nextReleased) next.add(key); else next.delete(key)
      return next
    })
    try {
      await fetch('/api/release-answer-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, questionId, released: nextReleased }),
      })
    } finally {
      setReleasingKey(false)
    }
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
  // How many of this student's works still need a grade (drives the queue).
  const remaining = useMemo(() => works.filter(w => !w.feedback?.grade).length, [works])

  // One door: honor ?student=&question= (drill straight to a work) or
  // ?class= (just open that class folder) deep links — used by the
  // dashboard's per-class "N ungraded" summary and the per-student page's
  // "View →".
  const [deepLink, setDeepLink] = useState<{ student?: string; question?: string; class?: string } | null>(null)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const student = p.get('student') ?? undefined
    const question = p.get('question') ?? undefined
    const classParam = p.get('class') ?? undefined
    if (student || question || classParam) setDeepLink({ student, question, class: classParam })
  }, [])
  useEffect(() => {
    if (!deepLink || submissions.length === 0) return
    if (deepLink.student) {
      const sub =
        submissions.find(s => s.student_id === deepLink.student && s.question_id === deepLink.question) ??
        submissions.find(s => s.student_id === deepLink.student)
      if (sub) {
        setClassId(classOf(sub)?.id ?? 'other')
        setStudentId(sub.student_id)
        openWork(sub)
      }
    } else if (deepLink.class) {
      setClassId(deepLink.class)
      setStudentId(null)
      setSelected(null)
    }
    setDeepLink(null)
  }, [deepLink, submissions]) // eslint-disable-line react-hooks/exhaustive-deps

  function openClass(id: string) { setClassId(id); setStudentId(null); setSelected(null) }
  function openStudent(id: string) { setStudentId(id); setSelected(null) }
  function openWork(sub: Submission) {
    setSelected(sub)
    setGrade(sub.feedback?.grade ?? null)
    setTextFeedback(sub.feedback?.text_feedback ?? '')
    setAiSuggestion(null)
    setAiError(null)
  }

  // AI reads a snapshot of the board and suggests a grade + feedback — a
  // SUGGESTION only, same as the live-class AI check. Nothing is graded or
  // sent to the student until the teacher clicks "Use this".
  async function runAiCheck() {
    if (!selected) return
    const snapshot = boardRef.current?.getSnapshot()
    if (!snapshot) return
    setAiChecking(true)
    setAiError(null)
    setAiSuggestion(null)
    try {
      const res = await fetch('/api/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: selected.questions?.title,
          questionContent: selected.questions?.content ?? null,
          boardImageDataUrl: snapshot,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI check failed')
      setAiSuggestion(data)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI check failed')
    } finally {
      setAiChecking(false)
    }
  }

  function acceptAiSuggestion() {
    if (!aiSuggestion) return
    setGrade(aiSuggestion.grade)
    setTextFeedback(aiSuggestion.feedback)
    setAiSuggestion(null)
  }

  // Checks every ungraded submission in the current class, one at a time
  // (gentler on the shared Gemini rate limit than firing them all at once).
  // Each is a SUGGESTION only — nothing is graded/sent until the teacher
  // reviews the results panel and clicks Approve on that one.
  async function runClassAiCheckAll() {
    const pending = activeClass?.subs.filter(s => !s.feedback?.grade) ?? []
    if (pending.length === 0) return
    setClassAiRunning(true)
    setClassAiResults(new Map())
    setClassAiProgress({ done: 0, total: pending.length })
    for (let i = 0; i < pending.length; i++) {
      const sub = pending[i]
      setClassAiResults(prev => new Map(prev).set(sub.id, { loading: true }))
      try {
        const snapshot = await renderBoardSnapshot(sub.canvas_data, sub.feedback?.canvas_data ?? null)
        if (!snapshot) {
          setClassAiResults(prev => new Map(prev).set(sub.id, { loading: false, error: 'No work on the board to check' }))
        } else {
          const res = await fetch('/api/ai-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionTitle: sub.questions?.title,
              questionContent: sub.questions?.content ?? null,
              boardImageDataUrl: snapshot,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'AI check failed')
          setClassAiResults(prev => new Map(prev).set(sub.id, { loading: false, grade: data.grade, feedback: data.feedback }))
        }
      } catch (err) {
        setClassAiResults(prev => new Map(prev).set(sub.id, { loading: false, error: err instanceof Error ? err.message : 'AI check failed' }))
      }
      setClassAiProgress({ done: i + 1, total: pending.length })
      // Small gap between calls — spreads the requests-per-minute load
      // instead of firing them back to back, which is what tends to trip
      // the shared Gemini rate limit during a big bulk run.
      if (i < pending.length - 1) await new Promise(r => setTimeout(r, 600))
    }
    setClassAiRunning(false)
  }

  async function approveClassAiResult(sub: Submission) {
    const result = classAiResults.get(sub.id)
    if (!result?.grade) return
    await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: sub.student_id,
        questionId: sub.question_id,
        grade: result.grade,
        textFeedback: result.feedback || null,
        notify: true,
      }),
    })
    setClassAiResults(prev => new Map(prev).set(sub.id, { ...result, approved: true }))
    patchFeedbackLocal(sub.id, { grade: result.grade, text_feedback: result.feedback || null })
    // Submissions' nav badge is a live ungraded count, not click-to-clear —
    // refresh the shared layout so it decrements right away instead of
    // waiting for the next hard navigation.
    router.refresh()
  }

  function dismissClassAiResult(subId: string) {
    setClassAiResults(prev => {
      const next = new Map(prev)
      next.delete(subId)
      return next
    })
  }

  // Keep `selected` in sync after a reload (e.g. grade saved) so its feedback is fresh
  useEffect(() => {
    if (!selected) return
    const fresh = submissions.find(s => s.id === selected.id)
    if (fresh && fresh !== selected) setSelected(fresh)
  }, [submissions]) // eslint-disable-line react-hooks/exhaustive-deps

  // All feedback writes go through the service-role API. The feedback table is
  // RLS-gated, so writing directly from the browser is blocked — which is why
  // grades used to silently never save (and stayed "pending"). The route also
  // notifies the student and records grade history.
  async function saveTeacherAnnotation(sId: string, qId: string, canvasData: string) {
    await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: sId, questionId: qId, canvasData }),
    })
    if (selected) patchFeedbackLocal(selected.id, { canvas_data: canvasData })
  }

  async function saveGrade() {
    if (!selected) return
    const cur = selected
    setGrading(true)
    await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: cur.student_id,
        questionId: cur.question_id,
        grade,
        textFeedback: textFeedback || null,
        notify: true,
      }),
    })
    setGrading(false)
    patchFeedbackLocal(cur.id, { grade, text_feedback: textFeedback || null })
    // Submissions' nav badge is a live ungraded count, not click-to-clear —
    // refresh the shared layout so it decrements right away.
    router.refresh()
    // Grading queue: jump to this student's next ungraded work so the teacher
    // can grade straight through without hunting in the list.
    const next = works.find(w => w.id !== cur.id && !w.feedback?.grade)
    if (next) openWork(next)
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
            <div className="px-3 pt-3 pb-2">
              <button
                onClick={runClassAiCheckAll}
                disabled={classAiRunning || ungraded(activeClass?.subs ?? []) === 0}
                className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              >
                {classAiRunning
                  ? `🤖 Checking ${classAiProgress?.done ?? 0}/${classAiProgress?.total ?? 0}…`
                  : `🤖 AI Check All Pending (${ungraded(activeClass?.subs ?? [])})`}
              </button>
            </div>
            <p className="px-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">Students ({students.length})</p>
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
                    <span className={`text-xs px-1.5 py-0.5 rounded inline-block font-medium ${GRADE_MAP[sub.feedback.grade]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
                      {GRADE_MAP[sub.feedback.grade]?.label ?? sub.feedback.grade}
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
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-purple-900">{selected.profiles?.full_name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gray-500">{selected.questions?.topics?.units?.title} → {selected.questions?.topics?.title} → {selected.questions?.title}</p>
                    {selected.questions?.difficulty && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                        selected.questions.difficulty === 'easy' ? 'bg-sky-100 text-sky-700' : selected.questions.difficulty === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {selected.questions.difficulty} · {selected.questions.points}pt{selected.questions.points === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  {selected.text_answer && <p className="text-xs text-gray-600 mt-1 bg-gray-50 px-2 py-1 rounded">📝 {selected.text_answer}</p>}
                </div>
                {/* grade buttons + feedback below */}
                <div className="flex items-center gap-2 flex-wrap">
                  {remaining > 0 && (
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">{remaining} left to grade</span>
                  )}
                  <button
                    onClick={runAiCheck}
                    disabled={aiChecking}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50"
                  >
                    {aiChecking ? '🤖 Checking…' : '🤖 AI Check'}
                  </button>
                  {/* Segmented control — one joined bar, flat fill only on the
                      selected option, instead of separate mismatched pills. */}
                  <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                    {GRADE_LIST.map((cfg, i) => (
                      <button key={cfg.value} onClick={() => setGrade(grade === cfg.value ? null : cfg.value)}
                        className={`px-3 py-1.5 text-sm font-semibold transition-colors ${i > 0 ? 'border-l border-gray-200' : ''} ${grade === cfg.value ? cfg.solid : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
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
              {(aiChecking || aiSuggestion || aiError) && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-start gap-2">
                  <span className="text-sm flex-shrink-0">🤖</span>
                  <div className="flex-1 min-w-0">
                    {aiChecking && <p className="text-sm text-indigo-600 italic">Reading the board…</p>}
                    {aiError && <p className="text-sm text-red-600">{aiError}</p>}
                    {aiSuggestion && (
                      <>
                        <p className={`text-sm font-bold ${aiSuggestion.grade === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                          AI says: {aiSuggestion.grade === 'correct' ? '✓ Correct' : '✗ Incorrect'}
                        </p>
                        <p className="text-sm text-gray-700 mt-0.5">{aiSuggestion.feedback}</p>
                        <div className="flex gap-2 mt-1.5">
                          <button onClick={acceptAiSuggestion} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
                            Use this
                          </button>
                          <button onClick={() => setAiSuggestion(null)} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100">
                            Dismiss
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Full question — so the teacher can read what was asked */}
            <div className="bg-white rounded-xl border border-gray-200 flex-shrink-0 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Question</span>
                <button onClick={() => setQuestionCollapsed(c => !c)} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
                  {questionCollapsed ? '▼ expand' : '▲ collapse'}
                </button>
              </div>
              {!questionCollapsed && (
                <div className="px-4 py-3 max-h-56 overflow-y-auto flex gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-gray-900">{selected.questions?.title}</p>
                    {selected.questions?.content && (
                      <p className="text-base text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">{selected.questions.content}</p>
                    )}
                  </div>
                  {selected.questions?.image_url && (
                    <ZoomableImage src={selected.questions.image_url} alt="Question diagram"
                      className="flex-shrink-0 max-h-48 max-w-[45%] rounded-lg border border-gray-200 object-contain bg-white self-start" />
                  )}
                </div>
              )}
            </div>

            <AnswerKeyPanel questionId={selected.question_id} initialAnswerKey={selected.questions?.answer_key ?? null} />

            <button
              onClick={() => toggleAnswerKeyRelease(selected.student_id, selected.question_id)}
              disabled={releasingKey}
              className={`text-sm font-semibold px-4 py-2 rounded-xl flex-shrink-0 self-start transition-colors disabled:opacity-50 ${
                isKeyReleased(selected.student_id, selected.question_id)
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
              }`}
            >
              {isKeyReleased(selected.student_id, selected.question_id) ? '🔓 Answer key released to this student — click to revoke' : '🔒 Release answer key to this student'}
            </button>

            <div className="flex-1 min-h-[500px] overflow-hidden">
              <InfiniteWhiteboard
                key={selected.id}
                ref={boardRef}
                questionId={selected.question_id}
                studentId={selected.student_id}
                role="teacher"
                initialStudentData={selected.canvas_data}
                initialTeacherData={selected.feedback?.canvas_data ?? null}
                onSaveTeacher={(data) => saveTeacherAnnotation(selected.student_id, selected.question_id, data)}
              />
            </div>
          </div>

          {/* Comments + AI Faridah chat */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
            {currentUser && (
              <Comments
                questionId={selected.question_id}
                studentId={selected.student_id}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
              />
            )}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <p className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm">🎓 AI Faridah Chat</p>
              <AiChatHistory questionId={selected.question_id} studentId={selected.student_id} />
            </div>
          </div>
        </div>
      ) : classAiResults.size > 0 ? (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-purple-900">🤖 AI Check results — {activeClass?.title}</p>
            <button onClick={() => setClassAiResults(new Map())} className="text-xs text-gray-400 hover:text-gray-700">Clear all</button>
          </div>
          {(activeClass?.subs ?? [])
            .filter(sub => classAiResults.has(sub.id))
            .map(sub => {
              const result = classAiResults.get(sub.id)!
              return (
                <div key={sub.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{sub.profiles?.full_name} — {sub.questions?.title}</p>
                      <p className="text-xs text-gray-400 truncate">{sub.questions?.topics?.title}</p>
                    </div>
                    <button
                      onClick={() => { setClassId(classOf(sub)?.id ?? 'other'); setStudentId(sub.student_id); openWork(sub) }}
                      className="flex-shrink-0 text-xs text-purple-600 hover:underline whitespace-nowrap"
                    >
                      Open board →
                    </button>
                  </div>
                  {result.loading && <p className="text-sm text-indigo-600 italic mt-1.5">Reading the board…</p>}
                  {result.error && <p className="text-sm text-red-600 mt-1.5">{result.error}</p>}
                  {result.grade && !result.approved && (
                    <div className="mt-1.5">
                      <p className={`text-sm font-bold ${result.grade === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                        AI says: {result.grade === 'correct' ? '✓ Correct' : '✗ Incorrect'}
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5">{result.feedback}</p>
                      <div className="flex gap-2 mt-1.5">
                        <button onClick={() => approveClassAiResult(sub)} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
                          ✓ Approve &amp; send
                        </button>
                        <button onClick={() => dismissClassAiResult(sub.id)} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                  {result.approved && <p className="text-sm text-green-700 font-semibold mt-1.5">✓ Grade sent to student</p>}
                </div>
              )
            })}
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
