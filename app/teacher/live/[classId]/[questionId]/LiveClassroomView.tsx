'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import MiniBoard from '@/components/MiniBoard'
import Comments from '@/components/Comments'
import AiChatHistory from '@/components/AiChatHistory'
import AnswerKeyPanel from '@/components/AnswerKeyPanel'
import TeacherWatchBoard from './[studentId]/TeacherWatchBoard'
import { GRADE_LIST, GRADE_MAP } from '@/lib/grades'
import { renderBoardSnapshot } from '@/lib/renderBoardSnapshot'

interface Student { id: string; full_name: string }
interface Submission { id: string; student_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }
interface Feedback { submission_id: string; grade: string | null; canvas_data?: string | null }
interface StudentNotification { id: string; type: string; student_id: string; question_id: string; class_id: string; created_at: string; read: boolean; student_name?: string }
interface CommentRow { id: string; student_id: string; author_id: string; message: string; created_at: string; authorRole: string }

interface ClassQuestion { id: string; title: string; topicTitle: string }

interface Props {
  classId: string
  questionId: string
  classTitle: string
  questionTitle: string
  questionContent: string | null
  answerKey: string | null
  allQuestions: ClassQuestion[]
  questionHelp: Record<string, number>
  students: Student[]
  initialSubmissions: Submission[]
  initialFeedbacks: Feedback[]
  initialNotifications: StudentNotification[]
  initialComments: CommentRow[]
  teacherId: string
  teacherName: string
  autoOpenCommentsStudentId: string | null
}

const GRADE_COLOR: Record<string, string> = {
  correct:    'border-green-400',
  partial:    'border-amber-400',
  incorrect:  'border-red-400',
  incomplete: 'border-gray-400',
  discussed:  'border-blue-400',
  needsmore:  'border-purple-400',
}

type Filter = 'all' | 'help' | 'done' | 'submitted' | 'unchecked'

export default function LiveClassroomView({
  classId, questionId, classTitle, questionTitle, questionContent, answerKey,
  allQuestions, questionHelp, students, initialSubmissions, initialFeedbacks, initialNotifications,
  initialComments, teacherId, teacherName, autoOpenCommentsStudentId,
}: Props) {
  const supabase = createClient()
  const [helpByQuestion, setHelpByQuestion] = useState<Record<string, number>>(questionHelp)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [commentsByStudent, setCommentsByStudent] = useState<Map<string, CommentRow[]>>(() => {
    const m = new Map<string, CommentRow[]>()
    for (const c of initialComments) m.set(c.student_id, [...(m.get(c.student_id) ?? []), c])
    return m
  })
  // Which students the teacher has already opened the comment popover for
  // THIS session — used to stop badging a thread as unseen once looked at.
  // There's no persisted "read" column on comments, so this is session-local,
  // same tradeoff notifications made before they got a real read flag.
  const [seenStudentIds, setSeenStudentIds] = useState<Set<string>>(new Set())
  const [commentsStudent, setCommentsStudent] = useState<Student | null>(null)
  // Popup live board — lets the teacher draw/annotate on one student's board
  // right from the grid without leaving it, so the rest of the class stays
  // visible behind the dimmed backdrop and can be reached again with one click.
  const [boardStudent, setBoardStudent] = useState<Student | null>(null)
  const [boardFullscreen, setBoardFullscreen] = useState(false)
  const [boardQuestionCollapsed, setBoardQuestionCollapsed] = useState(false)
  const [boardLoading, setBoardLoading] = useState(false)
  const [boardData, setBoardData] = useState<{
    submissionId: string | null; studentData: string | null; teacherData: string | null
    grade: string | null; feedbackText: string | null
  } | null>(null)
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(
    () => new Map(initialSubmissions.map(s => [s.student_id, s]))
  )
  const [grades, setGrades] = useState<Map<string, string>>(() => {
    const subMap = new Map(initialSubmissions.map(s => [s.id, s.student_id]))
    const m = new Map<string, string>()
    for (const f of initialFeedbacks) {
      if (f.grade) { const sid = subMap.get(f.submission_id); if (sid) m.set(sid, f.grade) }
    }
    return m
  })
  // Teacher's annotation layer per student — so the grid tile shows anything
  // the teacher already drew/wrote on a board, not just the student's own
  // strokes. Previously this only ever rendered canvas_data (the student's
  // layer), so annotations were invisible until you opened that student's
  // board again.
  const [feedbackCanvasByStudent, setFeedbackCanvasByStudent] = useState<Map<string, string>>(() => {
    const subMap = new Map(initialSubmissions.map(s => [s.id, s.student_id]))
    const m = new Map<string, string>()
    for (const f of initialFeedbacks) {
      if (f.canvas_data) { const sid = subMap.get(f.submission_id); if (sid) m.set(sid, f.canvas_data) }
    }
    return m
  })
  const [notifications, setNotifications] = useState<StudentNotification[]>(initialNotifications)
  const [filter, setFilter] = useState<Filter>('all')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [gradingId, setGradingId] = useState<string | null>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const [aiResults, setAiResults] = useState<Map<string, {
    loading: boolean; grade?: 'correct' | 'incorrect'; feedback?: string; error?: string; approved?: boolean
  }>>(new Map())
  const [aiCheckingAll, setAiCheckingAll] = useState(false)
  const [aiChatCounts, setAiChatCounts] = useState<Record<string, number>>({})
  const [aiChatStudent, setAiChatStudent] = useState<Student | null>(null)

  // Poll AI Faridah chat counts so the grid can badge which students have
  // used it — ai_chat_messages is RLS-gated to the student's own rows, same
  // reasoning as the feedback-canvas poll above, so this can't be realtime
  // via postgres_changes for a teacher client.
  useEffect(() => {
    let active = true
    async function poll() {
      try {
        const res = await fetch(`/api/ai-chat-counts?questionId=${questionId}`)
        if (!res.ok || !active) return
        const { countByStudent } = await res.json() as { countByStudent: Record<string, number> }
        setAiChatCounts(countByStudent)
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 10000)
    return () => { active = false; clearInterval(interval) }
  }, [questionId])

  // Same service-role write + broadcast pattern the single-student live board
  // uses, so both views (and the student's own toast) stay in sync regardless
  // of which one the grade was given from.
  async function applyGrade(studentId: string, newGrade: string | null) {
    setGradingId(studentId)
    setGrades(prev => {
      const next = new Map(prev)
      if (newGrade) next.set(studentId, newGrade)
      else next.delete(studentId)
      return next
    })
    try {
      await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, questionId, grade: newGrade, notify: true }),
      })
      await supabase.channel(`live-grades:${classId}:${questionId}`).send({
        type: 'broadcast', event: 'grade-update', payload: { student_id: studentId, grade: newGrade },
      })
      if (newGrade) {
        await supabase.channel(`grade-notif:${questionId}:${studentId}`).send({
          type: 'broadcast', event: 'grade-update', payload: { grade: newGrade, feedback: '' },
        })
      }
    } finally {
      setGradingId(null)
    }
  }

  // Grade a student right from the grid — no need to open their individual
  // board just to mark Correct/Wrong.
  async function gradeStudent(studentId: string, grade: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const newGrade = grades.get(studentId) === grade ? null : grade
    await applyGrade(studentId, newGrade)
  }

  // AI reads a rendered snapshot of the student's board (their strokes +
  // any teacher annotation already on it) and suggests a grade + feedback —
  // a SUGGESTION only. Nothing is graded or sent to the student until the
  // teacher clicks Approve.
  async function runAiCheck(studentId: string) {
    const sub = submissions.get(studentId)
    const teacherCanvas = feedbackCanvasByStudent.get(studentId) ?? null
    setAiResults(prev => new Map(prev).set(studentId, { loading: true }))
    try {
      const snapshot = await renderBoardSnapshot(sub?.canvas_data ?? null, teacherCanvas)
      if (!snapshot) {
        setAiResults(prev => new Map(prev).set(studentId, { loading: false, error: 'No work on the board to check' }))
        return
      }
      const res = await fetch('/api/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionTitle, questionContent, boardImageDataUrl: snapshot }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI check failed')
      setAiResults(prev => new Map(prev).set(studentId, { loading: false, grade: data.grade, feedback: data.feedback }))
    } catch (err) {
      setAiResults(prev => new Map(prev).set(studentId, { loading: false, error: err instanceof Error ? err.message : 'AI check failed' }))
    }
  }

  // Checks every student with work on the board, one at a time (gentler on
  // the shared Gemini rate limit than firing them all at once).
  async function runAiCheckAll() {
    setAiCheckingAll(true)
    try {
      for (const student of filteredStudents) {
        const sub = submissions.get(student.id)
        const teacherCanvas = feedbackCanvasByStudent.get(student.id) ?? null
        if (!sub?.canvas_data && !teacherCanvas) continue
        await runAiCheck(student.id)
      }
    } finally {
      setAiCheckingAll(false)
    }
  }

  // Teacher approves the AI's suggestion — actually applies the grade AND
  // sends the AI's feedback text to the student as a teacher comment, same
  // as if the teacher had typed it themselves in the Comments panel.
  async function approveAiSuggestion(student: Student) {
    const result = aiResults.get(student.id)
    if (!result?.grade) return
    await applyGrade(student.id, result.grade)

    if (result.feedback) {
      const now = new Date().toISOString()
      const { data: inserted, error } = await supabase.from('comments').insert({
        question_id: questionId,
        student_id: student.id,
        author_id: teacherId,
        message: result.feedback,
      }).select('id').single()

      if (!error && inserted) {
        const payload = {
          id: inserted.id, message: result.feedback, created_at: now,
          author_id: teacherId, author: { full_name: teacherName, role: 'teacher' },
        }
        await supabase.channel(`comments:${questionId}:${student.id}`).send({
          type: 'broadcast', event: 'new-comment', payload,
        })
        setCommentsByStudent(prev => {
          const next = new Map(prev)
          const list = next.get(student.id) ?? []
          next.set(student.id, [...list, {
            id: inserted.id, student_id: student.id, author_id: teacherId,
            message: result.feedback!, created_at: now, authorRole: 'teacher',
          }])
          return next
        })
        fetch('/api/notify-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id, questionId, type: 'comment', feedback: result.feedback }),
        })
      }
    }

    setAiResults(prev => new Map(prev).set(student.id, { ...result, approved: true }))
  }

  function dismissAiSuggestion(studentId: string) {
    setAiResults(prev => {
      const next = new Map(prev)
      next.delete(studentId)
      return next
    })
  }

  async function toggleChecked(studentId: string, e: React.MouseEvent) {
    e.stopPropagation()
    const wasChecked = checkedIds.has(studentId)
    setCheckedIds(prev => {
      const next = new Set(prev)
      wasChecked ? next.delete(studentId) : next.add(studentId)
      return next
    })
    // Mark notifications read when checked, unread when unchecked
    const studentNotifs = notifications.filter(n => n.student_id === studentId && n.question_id === questionId)
    const studentNotifIds = studentNotifs.map(n => n.id)
    const helpDelta = studentNotifs.filter(n => n.type === 'help' && n.read === wasChecked).length
    if (studentNotifIds.length) {
      await supabase.from('notifications').update({ read: !wasChecked }).in('id', studentNotifIds)
      setNotifications(prev => prev.map(n =>
        studentNotifIds.includes(n.id) ? { ...n, read: !wasChecked } : n
      ))
      if (helpDelta) {
        setHelpByQuestion(prev => ({
          ...prev,
          [questionId]: Math.max(0, (prev[questionId] ?? 0) + (wasChecked ? helpDelta : -helpDelta)),
        }))
      }
    }
  }

  // Sets of student IDs who need help / clicked done
  const helpIds = new Set(notifications.filter(n => n.type === 'help').map(n => n.student_id))
  const doneIds = new Set(notifications.filter(n => n.type === 'submitted').map(n => n.student_id))

  function playBeep() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(); osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  useEffect(() => {
    // Submissions realtime
    const subCh = supabase.channel(`live-subs:${classId}:${questionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `question_id=eq.${questionId}` }, payload => {
        const row = payload.new as Submission
        if (students.some(s => s.id === row.student_id))
          setSubmissions(prev => new Map(prev).set(row.student_id, row))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feedback' }, payload => {
        const fb = payload.new as { submission_id: string; grade: string | null }
        setSubmissions(prev => {
          for (const [sid, sub] of prev)
            if (sub.id === fb.submission_id && fb.grade)
              setGrades(g => new Map(g).set(sid, fb.grade!))
          return prev
        })
      })
      .subscribe()

    // Grade broadcast subscription
    const gradeCh = supabase.channel(`live-grades:${classId}:${questionId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'grade-update' }, ({ payload }) => {
        const { student_id, grade } = payload as { student_id: string; grade: string | null }
        setGrades(prev => {
          const next = new Map(prev)
          if (grade) next.set(student_id, grade)
          else next.delete(student_id)
          return next
        })
      })
      .subscribe()

    // Alerts — listen to the custom event relayed by TeacherNotificationBell
    // (avoids conflicting Supabase channel subscriptions for 'teacher-alerts')
    const handleAlert = (e: Event) => {
      const row = (e as CustomEvent<StudentNotification>).detail
      if (row.class_id === classId && row.type === 'help') {
        setHelpByQuestion(prev => ({ ...prev, [row.question_id]: (prev[row.question_id] ?? 0) + 1 }))
      }
      if (row.question_id === questionId) {
        setNotifications(prev => [{ ...row, read: false }, ...prev])
        playBeep()
      }
    }
    window.addEventListener('teacher-student-alert', handleAlert)

    return () => { supabase.removeChannel(subCh); supabase.removeChannel(gradeCh); window.removeEventListener('teacher-student-alert', handleAlert) }
  }, [classId, questionId])

  // Poll the teacher's own annotation layer for every student on this
  // question, so a tile shows what's already been drawn/written on it
  // without opening that student's board. feedback is RLS-gated the same way
  // submissions are, so this can't rely on postgres_changes — same reasoning
  // TeacherWatchBoard already uses for polling a single student's board.
  useEffect(() => {
    let active = true
    async function poll() {
      try {
        const res = await fetch(`/api/feedback-canvas?questionId=${questionId}`)
        if (!res.ok || !active) return
        const { canvasByStudent } = await res.json() as { canvasByStudent: Record<string, string> }
        setFeedbackCanvasByStudent(new Map(Object.entries(canvasByStudent)))
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => { active = false; clearInterval(interval) }
  }, [questionId])

  // Comments realtime — one channel per student (same channel name the
  // student's own board broadcasts new comments on), just to keep the grid's
  // badge counts live without opening every board. Fresh instances every run,
  // same "tried to join multiple times" reason documented in Comments.tsx.
  useEffect(() => {
    const channels = students.map(s => {
      const ch = supabase.channel(`comments:${questionId}:${s.id}`)
      ch.on('broadcast', { event: 'new-comment' }, ({ payload }) => {
        const incoming = payload as { id: string; author_id: string; message: string; created_at: string; author?: { role?: string } }
        const row: CommentRow = {
          id: incoming.id, student_id: s.id, author_id: incoming.author_id,
          message: incoming.message, created_at: incoming.created_at, authorRole: incoming.author?.role ?? '',
        }
        setCommentsByStudent(prev => {
          const next = new Map(prev)
          const list = next.get(s.id) ?? []
          if (!list.some(c => c.id === row.id)) next.set(s.id, [...list, row])
          return next
        })
      })
      ch.subscribe()
      return ch
    })
    return () => { channels.forEach(ch => supabase.removeChannel(ch)) }
  }, [questionId, students])

  // Marks the comment thread "seen" for THIS grid's badge styling only (goes
  // from the amber unseen pill to a neutral grey one). Deliberately does NOT
  // touch the notifications table — that stays unread, and the row keeps
  // showing on the dashboard's "Needs your attention" queue, until the
  // teacher explicitly checks the student off with the ○ button. Viewing a
  // comment isn't the same as having handled it.
  function markCommentsSeen(studentId: string) {
    setSeenStudentIds(prev => new Set(prev).add(studentId))
  }

  // Deep link from the dashboard's "Needs your attention" queue — jump
  // straight into a student's comment thread instead of just the grid.
  useEffect(() => {
    if (!autoOpenCommentsStudentId) return
    const student = students.find(s => s.id === autoOpenCommentsStudentId)
    if (student) {
      setCommentsStudent(student)
      markCommentsSeen(student.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCommentsStudentId, students])

  function openComments(student: Student, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setCommentsStudent(student)
    markCommentsSeen(student.id)
  }

  async function openBoard(student: Student) {
    setBoardStudent(student)
    setBoardFullscreen(false)
    setBoardLoading(true)
    setBoardData(null)
    try {
      const res = await fetch(`/api/submission?questionId=${questionId}&studentId=${student.id}`)
      const data = await res.json() as {
        submissionId: string | null; canvasData: string | null; feedbackCanvas: string | null
        grade: string | null; textFeedback: string | null
      }
      setBoardData({
        submissionId: data.submissionId,
        studentData: data.canvasData,
        teacherData: data.feedbackCanvas,
        grade: data.grade,
        feedbackText: data.textFeedback,
      })
    } finally {
      setBoardLoading(false)
    }
  }

  async function markAllRead() {
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const otherHelp = allQuestions.reduce((sum, q) => q.id !== questionId ? sum + (helpByQuestion[q.id] ?? 0) : sum, 0)
  const submittedCount = students.filter(s => submissions.has(s.id)).length
  // A student no longer "needs review" once either the teacher has checked
  // them off OR already assigned a grade — grading from the grid or the
  // individual board is itself a review, so it shouldn't still nag.
  const needsReview = (id: string) => (helpIds.has(id) || doneIds.has(id)) && !checkedIds.has(id) && !grades.has(id)
  const uncheckedNeedingReview = students.filter(s => needsReview(s.id)).length

  const filteredStudents = students.filter(s => {
    if (filter === 'help') return helpIds.has(s.id)
    if (filter === 'done') return doneIds.has(s.id)
    if (filter === 'submitted') return submissions.has(s.id)
    if (filter === 'unchecked') return needsReview(s.id)
    return true
  })

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/teacher" className="text-gray-500 hover:text-gray-900 text-sm flex-shrink-0">← Back</Link>
          <div className="relative min-w-0">
            <button
              onClick={() => setSwitcherOpen(o => !o)}
              className="flex items-center gap-2 text-left hover:bg-gray-100 rounded-lg px-2 py-1 -mx-2 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 leading-none mb-0.5">{classTitle}</p>
                <h1 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 truncate">
                  <span className="truncate">{questionTitle}</span>
                  <span className="text-gray-400 flex-shrink-0">▾</span>
                </h1>
              </div>
              {otherHelp > 0 && (
                <span className="flex-shrink-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  🙋 {otherHelp} on other Qs
                </span>
              )}
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-96 max-h-[70vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl z-50 py-1">
                  <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-100">Jump to question</p>
                  {allQuestions.map(q => {
                    const help = helpByQuestion[q.id] ?? 0
                    const isCurrent = q.id === questionId
                    return (
                      <button
                        key={q.id}
                        onClick={() => { if (!isCurrent) window.location.href = `/teacher/live/${classId}/${q.id}` }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                          isCurrent ? 'bg-purple-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="min-w-0">
                          {q.topicTitle && <p className="text-[10px] text-gray-400 truncate">{q.topicTitle}</p>}
                          <p className={`text-xs font-medium truncate ${isCurrent ? 'text-purple-700' : 'text-gray-700'}`}>
                            {isCurrent && '● '}{q.title}
                          </p>
                        </div>
                        {help > 0 && (
                          <span className="flex-shrink-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            🙋 {help}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            {questionContent && <p className="text-xs text-gray-500 truncate max-w-xl">{questionContent}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={runAiCheckAll}
            disabled={aiCheckingAll}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
          >
            {aiCheckingAll ? '🤖 Checking…' : '🤖 AI Check All'}
          </button>
          <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
            {submittedCount}/{students.length} submitted
          </span>
          {checkedIds.size > 0 && (
            <span className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full font-semibold">
              ✅ {checkedIds.size} checked
            </span>
          )}
          {uncheckedNeedingReview > 0 && (
            <button onClick={() => setFilter('unchecked')}
              className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse hover:bg-red-500">
              ⚠️ {uncheckedNeedingReview} still need review
            </button>
          )}
          {helpIds.size > 0 && (
            <button onClick={() => setFilter('help')}
              className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-amber-400">
              🙋 {helpIds.size} need help
            </button>
          )}
          {doneIds.size > 0 && (
            <button onClick={() => setFilter('done')}
              className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-purple-500">
              ✓ {doneIds.size} done
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-200 px-5 py-2 flex items-center gap-2">
        {([
          ['all', `All (${students.length})`],
          ['unchecked', `⚠️ Unchecked (${uncheckedNeedingReview})`],
          ['help', `🙋 Help (${helpIds.size})`],
          ['done', `✓ Done (${doneIds.size})`],
          ['submitted', `Submitted (${submittedCount})`],
        ] as [Filter, string][]).map(([f, label]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === f ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Answer key — sits above the tiles (not inside the scroll area) so
          it's visible the whole time the teacher is comparing student work
          against it, not just at the top of a scroll. */}
      <div className="bg-white border-b border-gray-200 px-5 py-2 flex-shrink-0">
        <AnswerKeyPanel questionId={questionId} initialAnswerKey={answerKey} />
      </div>

      {/* Grid — big enough tiles to actually read a student's handwriting at
          a glance, so a teacher can watch everyone at once (a few per row,
          scroll for the rest) instead of tiny unreadable thumbnails. */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredStudents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No students match this filter</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStudents.map(student => {
              const sub = submissions.get(student.id)
              const teacherCanvas = feedbackCanvasByStudent.get(student.id) ?? null
              const grade = grades.get(student.id)
              const needsHelp = helpIds.has(student.id)
              const isDone = doneIds.has(student.id)
              const isChecked = checkedIds.has(student.id)
              const studentComments = commentsByStudent.get(student.id) ?? []
              const hasUnseenComment = studentComments.some(c => c.authorRole !== 'teacher') && !seenStudentIds.has(student.id)
              const aiResult = aiResults.get(student.id)

              return (
                <div key={student.id} className="relative">
                  {/* A plain div, not a <button> — it now contains real grade
                      buttons, and a button can't legally contain a button. */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openBoard(student)}
                    onKeyDown={e => { if (e.key === 'Enter') openBoard(student) }}
                    className={`w-full rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-xl bg-white cursor-pointer ${
                      isChecked   ? 'border-green-400 opacity-60' :
                      needsHelp   ? 'border-amber-400 shadow-lg shadow-amber-100' :
                      isDone      ? 'border-purple-400' :
                      grade       ? GRADE_COLOR[grade] :
                      sub         ? 'border-blue-300' :
                                    'border-gray-200'
                    }`}
                  >
                    {/* Live-rendered board snapshot — properly draws the
                        saved strokes instead of the old broken <img> that
                        tried to use the JSON data as an image URL. */}
                    <div className="w-full h-64 md:h-72 bg-white relative overflow-hidden">
                      {sub?.text_answer && !sub?.canvas_data ? (
                        <div className="p-3 text-sm text-gray-600 overflow-hidden h-full line-clamp-[10]">{sub.text_answer}</div>
                      ) : sub || teacherCanvas ? (
                        <MiniBoard canvasData={sub?.canvas_data ?? null} teacherCanvasData={teacherCanvas} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-300 text-xs">No work yet</span>
                        </div>
                      )}
                      {needsHelp && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold">🙋 Help</span>}
                      {isDone && !needsHelp && <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">✓ Done</span>}
                      {grade && (
                        <span className={`absolute bottom-2 left-2 text-xs px-2 py-1 rounded-full font-bold text-white ${GRADE_MAP[grade]?.solid ?? 'bg-amber-500'}`}>
                          {GRADE_MAP[grade] ? `${GRADE_MAP[grade].icon} ${GRADE_MAP[grade].label}` : grade}
                        </span>
                      )}
                      {/* Checked overlay */}
                      {isChecked && (
                        <div className="absolute inset-0 bg-green-50/70 flex items-center justify-center">
                          <span className="text-green-600 text-3xl font-black">✅</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-lg">Open board</span>
                      </div>
                    </div>
                    {/* AI check suggestion — read-only until the teacher
                        clicks Approve, which is what actually applies the
                        grade and sends the feedback to the student. */}
                    {aiResult && (
                      <div className="px-3 py-2 bg-indigo-50 border-t border-indigo-100 flex items-start gap-2" onClick={e => e.stopPropagation()}>
                        <span className="text-sm flex-shrink-0">🤖</span>
                        <div className="flex-1 min-w-0">
                          {aiResult.loading && <p className="text-xs text-indigo-600 italic">Reading the board…</p>}
                          {aiResult.error && <p className="text-xs text-red-600">{aiResult.error}</p>}
                          {aiResult.grade && !aiResult.approved && (
                            <>
                              <p className={`text-xs font-bold ${aiResult.grade === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                                AI says: {aiResult.grade === 'correct' ? '✓ Correct' : '✗ Incorrect'}
                              </p>
                              <p className="text-xs text-indigo-900 mt-0.5">{aiResult.feedback}</p>
                              <div className="flex gap-2 mt-1.5">
                                <button
                                  onClick={() => approveAiSuggestion(student)}
                                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                  ✓ Approve &amp; send
                                </button>
                                <button
                                  onClick={() => dismissAiSuggestion(student.id)}
                                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                >
                                  Dismiss
                                </button>
                              </div>
                            </>
                          )}
                          {aiResult.approved && <p className="text-xs text-green-700 font-semibold">✓ Sent to student</p>}
                        </div>
                      </div>
                    )}
                    <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isChecked ? 'text-green-600 line-through' : 'text-gray-900'}`}>{student.full_name}</p>
                        <p className="text-xs text-gray-500">{isChecked ? '✅ Checked' : needsHelp ? '🙋 Needs help' : isDone ? '✓ Done' : grade ? grade : sub ? 'In progress' : 'Not started'}</p>
                      </div>
                      {/* Grade right from the grid — no need to open the
                          student's individual board just to mark it. */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); runAiCheck(student.id) }}
                          disabled={aiResult?.loading}
                          title="AI check this board"
                          className="flex-shrink-0 text-xs font-bold px-2 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          🤖
                        </button>
                        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                          {GRADE_LIST.map((g, i) => (
                            <button
                              key={g.value}
                              onClick={e => gradeStudent(student.id, g.value, e)}
                              disabled={gradingId === student.id}
                              title={g.label}
                              className={`px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${i > 0 ? 'border-l border-gray-200' : ''} ${grade === g.value ? g.solid : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                            >
                              {g.icon}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={e => openComments(student, e)}
                          title={studentComments.length > 0 ? `${studentComments.length} comment${studentComments.length > 1 ? 's' : ''}` : 'No comments yet'}
                          className={`relative flex-shrink-0 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
                            hasUnseenComment ? 'bg-amber-500 text-white hover:bg-amber-400' :
                            studentComments.length > 0 ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :
                            'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          💬{studentComments.length > 0 && <span className="ml-1">{studentComments.length}</span>}
                          {hasUnseenComment && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                          )}
                        </button>
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setAiChatStudent(student) }}
                          title={aiChatCounts[student.id] ? `${aiChatCounts[student.id]} AI Faridah messages` : 'No AI Faridah chat yet'}
                          className={`flex-shrink-0 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ${
                            aiChatCounts[student.id] ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          🎓{aiChatCounts[student.id] > 0 && <span className="ml-1">{aiChatCounts[student.id]}</span>}
                        </button>
                        <Link
                          href={`/teacher/students/${student.id}`}
                          onClick={e => e.stopPropagation()}
                          className="text-gray-400 hover:text-purple-600 flex-shrink-0 text-xs leading-none"
                          title="View student's questions"
                        >
                          ↗
                        </Link>
                      </div>
                    </div>
                  </div>
                  {/* Check button — sits outside the card */}
                  <button
                    onClick={e => toggleChecked(student.id, e)}
                    className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all ${
                      isChecked
                        ? 'bg-green-500 text-white hover:bg-red-500'
                        : 'bg-white/90 text-gray-400 border border-gray-200 hover:bg-green-500 hover:text-white hover:border-green-500'
                    }`}
                    title={isChecked ? 'Mark unchecked' : 'Mark as checked'}
                  >
                    {isChecked ? '✓' : '○'}
                  </button>
                </div>
              )
            })}
          </div>
          </>
        )}
      </div>

      {/* Comments modal — view/reply to a student's comment thread without
          leaving the grid or opening their full live board. */}
      {commentsStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setCommentsStudent(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-gray-900 text-sm">{commentsStudent.full_name}</p>
              <button onClick={() => setCommentsStudent(null)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
            </div>
            <Comments
              questionId={questionId}
              studentId={commentsStudent.id}
              currentUserId={teacherId}
              currentUserName={teacherName}
            />
          </div>
        </div>
      )}

      {/* AI Faridah chat transcript — read-only, so the teacher can see
          exactly what a student asked and how the AI guided them. */}
      {aiChatStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setAiChatStudent(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="font-semibold text-gray-900 text-sm">🎓 {aiChatStudent.full_name} — AI Faridah chat</p>
              <button onClick={() => setAiChatStudent(null)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
            </div>
            <AiChatHistory questionId={questionId} studentId={aiChatStudent.id} />
          </div>
        </div>
      )}

      {/* Live board popup — draw/grade on one student's board without
          navigating away, so the rest of the class stays visible behind the
          dimmed backdrop and one click gets the teacher back to the grid. */}
      {boardStudent && (
        <div className={`fixed inset-0 z-50 bg-black/60 flex items-center justify-center ${boardFullscreen ? '' : 'p-4'}`} onClick={() => setBoardStudent(null)}>
          <div className={`bg-gray-950 shadow-2xl flex flex-col overflow-hidden ${boardFullscreen ? 'w-screen h-screen' : 'rounded-xl w-full max-w-5xl h-[85vh]'}`} onClick={e => e.stopPropagation()}>
            <div className="bg-gray-900 border-b border-gray-700 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
              <p className="font-semibold text-white text-sm">{boardStudent.full_name}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBoardFullscreen(f => !f)}
                  className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-gray-800 rounded-lg"
                  title={boardFullscreen ? 'Exit full screen' : 'Enter full screen'}
                >
                  {boardFullscreen ? '⤡ Exit full screen' : '⤢ Full screen'}
                </button>
                <button onClick={() => setBoardStudent(null)} className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-gray-800 rounded-lg">Close</button>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex">
              {boardLoading || !boardData ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Loading board…</div>
              ) : (
                <>
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Question — collapsible, same as the individual student
                        watch page and the async submissions review page, so
                        this popup (fullscreen or not) has the same context
                        instead of just a bare canvas. */}
                    <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex-shrink-0 max-h-[35%] overflow-y-auto">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Question</span>
                        <button onClick={() => setBoardQuestionCollapsed(c => !c)} className="text-xs text-gray-500 hover:text-gray-300 font-medium flex-shrink-0">
                          {boardQuestionCollapsed ? '▼ expand' : '▲ collapse'}
                        </button>
                      </div>
                      {!boardQuestionCollapsed && (
                        <div className="mt-1.5">
                          <p className="text-sm font-semibold text-white">{questionTitle}</p>
                          {questionContent && <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap leading-relaxed">{questionContent}</p>}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-h-0">
                      <TeacherWatchBoard
                        key={boardStudent.id}
                        classId={classId}
                        questionId={questionId}
                        studentId={boardStudent.id}
                        questionTitle={questionTitle}
                        questionContent={questionContent}
                        answerKey={answerKey}
                        submissionId={boardData.submissionId}
                        initialStudentData={boardData.studentData}
                        initialTeacherData={boardData.teacherData}
                        initialGrade={boardData.grade}
                        initialFeedbackText={boardData.feedbackText}
                      />
                    </div>
                  </div>

                  {/* Comments + AI Faridah chat — same sidebar the individual
                      student watch page has, missing here before. */}
                  <div className="w-72 flex-shrink-0 border-l border-gray-700 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-800 flex-shrink-0">
                      <Comments
                        questionId={questionId}
                        studentId={boardStudent.id}
                        currentUserId={teacherId}
                        currentUserName={teacherName}
                      />
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 flex-shrink-0">🎓 AI Faridah Chat</p>
                      <div className="flex-1 min-h-0 bg-gray-900 rounded-lg overflow-hidden">
                        <AiChatHistory questionId={questionId} studentId={boardStudent.id} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
