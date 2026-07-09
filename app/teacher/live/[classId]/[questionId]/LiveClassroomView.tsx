'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import MiniBoard from '@/components/MiniBoard'
import { GRADE_LIST } from '@/lib/grades'

interface Student { id: string; full_name: string }
interface Submission { id: string; student_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }
interface Feedback { submission_id: string; grade: string | null }
interface StudentNotification { id: string; type: string; student_id: string; question_id: string; class_id: string; created_at: string; read: boolean; student_name?: string }

interface ClassQuestion { id: string; title: string; topicTitle: string }

interface Props {
  classId: string
  questionId: string
  classTitle: string
  questionTitle: string
  questionContent: string | null
  allQuestions: ClassQuestion[]
  questionHelp: Record<string, number>
  students: Student[]
  initialSubmissions: Submission[]
  initialFeedbacks: Feedback[]
  initialNotifications: StudentNotification[]
}

const GRADE_COLOR: Record<string, string> = {
  correct:   'border-green-400',
  partial:   'border-amber-400',
  incorrect: 'border-red-400',
  discussed: 'border-blue-400',
  needsmore: 'border-purple-400',
}

type Filter = 'all' | 'help' | 'done' | 'submitted' | 'unchecked'

export default function LiveClassroomView({
  classId, questionId, classTitle, questionTitle, questionContent,
  allQuestions, questionHelp, students, initialSubmissions, initialFeedbacks, initialNotifications,
}: Props) {
  const supabase = createClient()
  const [helpByQuestion, setHelpByQuestion] = useState<Record<string, number>>(questionHelp)
  const [switcherOpen, setSwitcherOpen] = useState(false)
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
  const [notifications, setNotifications] = useState<StudentNotification[]>(initialNotifications)
  const [filter, setFilter] = useState<Filter>('all')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [gradingId, setGradingId] = useState<string | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  // Grade a student right from the grid — no need to open their individual
  // board just to mark Correct/Wrong. Same service-role write + broadcast
  // pattern the single-student live board uses, so both views (and the
  // student's own toast) stay in sync regardless of which one the grade was
  // given from.
  async function gradeStudent(studentId: string, grade: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const newGrade = grades.get(studentId) === grade ? null : grade
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
          {/* Active tiles first — students with actual work or that need attention
              get the full board. Students who haven't started yet are pushed into
              a compact strip below instead of each rendering a full-height empty
              board, which was making the whole screen look sparse. */}
          {(() => {
            const active = filteredStudents.filter(s => submissions.has(s.id) || helpIds.has(s.id) || doneIds.has(s.id))
            const notStarted = filteredStudents.filter(s => !submissions.has(s.id) && !helpIds.has(s.id) && !doneIds.has(s.id))
            return (
              <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map(student => {
              const sub = submissions.get(student.id)
              const grade = grades.get(student.id)
              const needsHelp = helpIds.has(student.id)
              const isDone = doneIds.has(student.id)
              const isChecked = checkedIds.has(student.id)

              return (
                <div key={student.id} className="relative">
                  {/* A plain div, not a <button> — it now contains real grade
                      buttons, and a button can't legally contain a button. */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { window.location.href = `/teacher/live/${classId}/${questionId}/${student.id}` }}
                    onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/teacher/live/${classId}/${questionId}/${student.id}` }}
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
                      ) : (
                        <MiniBoard canvasData={sub?.canvas_data ?? null} />
                      )}
                      {needsHelp && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold">🙋 Help</span>}
                      {isDone && !needsHelp && <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">✓ Done</span>}
                      {grade && <span className={`absolute bottom-2 left-2 text-xs px-2 py-1 rounded-full font-bold text-white ${grade === 'correct' ? 'bg-green-500' : grade === 'incorrect' ? 'bg-red-500' : grade === 'discussed' ? 'bg-blue-500' : grade === 'needsmore' ? 'bg-purple-500' : 'bg-amber-500'}`}>{grade === 'correct' ? '✓ Correct' : grade === 'incorrect' ? '✗ Wrong' : grade === 'discussed' ? '💬 Discussed' : grade === 'needsmore' ? '½ Partial' : grade}</span>}
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
                    <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isChecked ? 'text-green-600 line-through' : 'text-gray-900'}`}>{student.full_name}</p>
                        <p className="text-xs text-gray-500">{isChecked ? '✅ Checked' : needsHelp ? '🙋 Needs help' : isDone ? '✓ Done' : grade ? grade : sub ? 'In progress' : 'Not started'}</p>
                      </div>
                      {/* Grade right from the grid — no need to open the
                          student's individual board just to mark it. */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
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

          {notStarted.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-400 mb-2 px-1">Not started yet ({notStarted.length})</p>
              <div className="flex flex-wrap gap-2">
                {notStarted.map(student => (
                  <div
                    key={student.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { window.location.href = `/teacher/live/${classId}/${questionId}/${student.id}` }}
                    onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/teacher/live/${classId}/${questionId}/${student.id}` }}
                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-3 pr-1 py-1 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                    <span className="text-xs text-gray-500">{student.full_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
              </>
            )
          })()}
          </>
        )}
      </div>

    </div>
  )
}
