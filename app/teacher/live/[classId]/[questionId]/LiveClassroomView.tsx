'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Student { id: string; full_name: string }
interface Submission { id: string; student_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }
interface Feedback { submission_id: string; grade: string | null }
interface StudentNotification { id: string; type: string; student_id: string; question_id: string; class_id: string; created_at: string; read: boolean; student_name?: string }

interface Props {
  classId: string
  questionId: string
  classTitle: string
  questionTitle: string
  questionContent: string | null
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

type Filter = 'all' | 'help' | 'done' | 'submitted'

export default function LiveClassroomView({
  classId, questionId, classTitle, questionTitle, questionContent,
  students, initialSubmissions, initialFeedbacks, initialNotifications,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
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
  const audioRef = useRef<AudioContext | null>(null)

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

    // Alerts via broadcast
    const alertCh = supabase.channel('teacher-alerts', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'student-alert' }, ({ payload }) => {
        const row = payload as StudentNotification
        if (row.question_id === questionId) {
          setNotifications(prev => [{ ...row, read: false }, ...prev])
          playBeep()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(subCh); supabase.removeChannel(gradeCh); supabase.removeChannel(alertCh) }
  }, [classId, questionId])

  async function markAllRead() {
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // Filter students
  const filteredStudents = students.filter(s => {
    if (filter === 'help') return helpIds.has(s.id)
    if (filter === 'done') return doneIds.has(s.id)
    if (filter === 'submitted') return submissions.has(s.id)
    return true
  })

  const submittedCount = students.filter(s => submissions.has(s.id)).length

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-700 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/teacher" className="text-gray-400 hover:text-white text-sm">← Back</Link>
          <div>
            <h1 className="font-bold text-white text-sm">{classTitle} — {questionTitle}</h1>
            {questionContent && <p className="text-xs text-gray-400">{questionContent}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-full">
            {submittedCount}/{students.length} submitted
          </span>
          {helpIds.size > 0 && (
            <button onClick={() => { setFilter('help'); markAllRead() }}
              className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse hover:bg-amber-400">
              🙋 {helpIds.size} need help
            </button>
          )}
          {doneIds.size > 0 && (
            <button onClick={() => { setFilter('done'); markAllRead() }}
              className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-purple-500">
              ✓ {doneIds.size} done
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-5 py-2 flex items-center gap-2">
        {([['all', `All (${students.length})`], ['help', `🙋 Need Help (${helpIds.size})`], ['done', `✓ Done (${doneIds.size})`], ['submitted', `Submitted (${submittedCount})`]] as [Filter, string][]).map(([f, label]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${filter === f ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredStudents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No students match this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredStudents.map(student => {
              const sub = submissions.get(student.id)
              const grade = grades.get(student.id)
              const needsHelp = helpIds.has(student.id)
              const isDone = doneIds.has(student.id)

              return (
                <button
                  key={student.id}
                  onClick={() => router.push(`/teacher/live/${classId}/${questionId}/${student.id}`)}
                  className={`rounded-xl border-2 overflow-hidden text-left transition-all hover:scale-105 hover:shadow-xl ${
                    needsHelp ? 'border-amber-400 shadow-amber-900/50 shadow-lg' :
                    isDone    ? 'border-purple-500' :
                    grade     ? GRADE_COLOR[grade] :
                    sub       ? 'border-blue-500' :
                                'border-gray-700'
                  } bg-gray-800`}
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-video bg-gray-900 relative overflow-hidden">
                    {sub?.canvas_data ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sub.canvas_data} alt="" className="w-full h-full object-contain" />
                    ) : sub?.text_answer ? (
                      <div className="p-2 text-xs text-gray-300 overflow-hidden h-full line-clamp-4">{sub.text_answer}</div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-600 text-xs">No work yet</span>
                      </div>
                    )}
                    {needsHelp && <span className="absolute top-1 right-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">🙋</span>}
                    {isDone && !needsHelp && <span className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">✓</span>}
                    {grade && <span className={`absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded-full font-bold text-white ${grade === 'correct' ? 'bg-green-500' : grade === 'incorrect' ? 'bg-red-500' : grade === 'discussed' ? 'bg-blue-500' : grade === 'needsmore' ? 'bg-purple-500' : 'bg-amber-500'}`}>{grade === 'correct' ? '✓' : grade === 'incorrect' ? '✗' : grade === 'discussed' ? '💬' : grade === 'needsmore' ? '🔄' : '~'}</span>}
                    {/* Click hint */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-lg">Click to expand</span>
                    </div>
                  </div>
                  <div className="px-2 py-1.5 bg-gray-800 flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{student.full_name}</p>
                      <p className="text-xs text-gray-400">{needsHelp ? '🙋 Needs help' : isDone ? '✓ Done' : grade ? grade : sub ? 'In progress' : 'Not started'}</p>
                    </div>
                    <Link
                      href={`/teacher/students/${student.id}`}
                      onClick={e => e.stopPropagation()}
                      className="text-gray-500 hover:text-purple-400 flex-shrink-0 text-xs leading-none"
                      title="View student's questions"
                    >
                      ↗
                    </Link>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
