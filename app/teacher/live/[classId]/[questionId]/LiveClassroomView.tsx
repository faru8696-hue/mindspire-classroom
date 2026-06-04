'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Student { id: string; full_name: string }
interface Submission { id: string; student_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }
interface Feedback { submission_id: string; grade: string | null }
interface StudentNotification { id: string; type: string; student_id: string; question_id: string; class_id: string; created_at: string; read: boolean; student_name?: string; question_title?: string }

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
  correct: 'border-green-400 bg-green-50',
  partial: 'border-amber-400 bg-amber-50',
  incorrect: 'border-red-400 bg-red-50',
}

export default function LiveClassroomView({
  classId, questionId, classTitle, questionTitle, questionContent,
  students, initialSubmissions, initialFeedbacks, initialNotifications,
}: Props) {
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(
    () => new Map(initialSubmissions.map(s => [s.student_id, s]))
  )
  const [grades, setGrades] = useState<Map<string, string>>(
    () => {
      const subMap = new Map(initialSubmissions.map(s => [s.id, s.student_id]))
      const m = new Map<string, string>()
      for (const f of initialFeedbacks) {
        if (f.grade) {
          const sid = subMap.get(f.submission_id)
          if (sid) m.set(sid, f.grade)
        }
      }
      return m
    }
  )
  const [notifications, setNotifications] = useState<StudentNotification[]>(initialNotifications)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [alertPlayed, setAlertPlayed] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)

  const unreadNotifs = notifications.filter(n => !n.read)
  const helpRequests = unreadNotifs.filter(n => n.type === 'help')
  const doneRequests = unreadNotifs.filter(n => n.type === 'submitted')

  function playBeep() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  // Realtime: new submissions + grades
  useEffect(() => {
    const subChannel = supabase.channel(`live-subs:${classId}:${questionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions',
        filter: `question_id=eq.${questionId}`,
      }, payload => {
        const row = payload.new as Submission
        if (students.some(s => s.id === row.student_id)) {
          setSubmissions(prev => new Map(prev).set(row.student_id, row))
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'feedback',
      }, payload => {
        const fb = payload.new as { submission_id: string; grade: string | null }
        setSubmissions(prev => {
          for (const [sid, sub] of prev) {
            if (sub.id === fb.submission_id && fb.grade) {
              setGrades(g => new Map(g).set(sid, fb.grade!))
            }
          }
          return prev
        })
      })
      .subscribe()

    // Alerts via broadcast
    const alertChannel = supabase.channel('teacher-alerts', {
      config: { broadcast: { self: false } },
    })
      .on('broadcast', { event: 'student-alert' }, ({ payload }) => {
        const row = payload as StudentNotification
        if (row.question_id === questionId) {
          setNotifications(prev => [{ ...row, read: false }, ...prev])
          playBeep()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subChannel)
      supabase.removeChannel(alertChannel)
    }
  }, [classId, questionId])

  async function markAllRead() {
    const ids = unreadNotifs.map(n => n.id)
    if (ids.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const submittedCount = students.filter(s => submissions.has(s.id)).length
  const helpCount = helpRequests.length

  const selectedSub = selectedStudent ? submissions.get(selectedStudent) : null

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">{classTitle} — {questionTitle}</h1>
            {questionContent && <p className="text-xs text-gray-500">{questionContent}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
            {submittedCount}/{students.length} submitted
          </span>

          {/* Help alerts */}
          {helpCount > 0 && (
            <button
              onClick={markAllRead}
              className="relative bg-amber-500 text-white text-sm font-semibold px-3 py-1.5 rounded-full animate-pulse hover:bg-amber-600 transition-colors"
            >
              🙋 {helpCount} need{helpCount === 1 ? 's' : ''} help
            </button>
          )}

          {/* Done alerts */}
          {doneRequests.length > 0 && (
            <button
              onClick={markAllRead}
              className="bg-purple-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-purple-700 transition-colors"
            >
              ✓ {doneRequests.length} done
            </button>
          )}

          {unreadNotifs.length === 0 && (
            <span className="text-xs text-gray-400">No new alerts</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Student grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Help queue at top */}
          {helpRequests.length > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3">
              <p className="text-sm font-semibold text-amber-800 mb-2">🙋 Help Requests</p>
              <div className="flex flex-wrap gap-2">
                {helpRequests.map(n => {
                  const student = students.find(s => s.id === n.student_id)
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelectedStudent(n.student_id)}
                      className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors"
                    >
                      {student?.full_name ?? 'Unknown'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {students.map(student => {
              const sub = submissions.get(student.id)
              const grade = grades.get(student.id)
              const needsHelp = helpRequests.some(n => n.student_id === student.id)
              const isDone = doneRequests.some(n => n.student_id === student.id)
              const isSelected = selectedStudent === student.id

              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(isSelected ? null : student.id)}
                  className={`rounded-xl border-2 overflow-hidden text-left transition-all hover:shadow-md ${
                    isSelected ? 'border-purple-500 shadow-lg' :
                    needsHelp ? 'border-amber-400 shadow-md' :
                    grade ? GRADE_COLOR[grade] :
                    sub ? 'border-blue-300 bg-blue-50' :
                    'border-gray-200 bg-white'
                  }`}
                >
                  {/* Canvas thumbnail */}
                  <div className="w-full aspect-video bg-gray-100 relative overflow-hidden">
                    {sub?.canvas_data ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sub.canvas_data} alt="" className="w-full h-full object-contain" />
                    ) : sub?.text_answer ? (
                      <div className="p-2 text-xs text-gray-600 line-clamp-4 overflow-hidden h-full">
                        {sub.text_answer}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-300 text-xs">Empty</span>
                      </div>
                    )}

                    {/* Badges */}
                    {needsHelp && (
                      <span className="absolute top-1 right-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">🙋</span>
                    )}
                    {isDone && !needsHelp && (
                      <span className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">✓</span>
                    )}
                    {grade && (
                      <span className={`absolute bottom-1 right-1 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        grade === 'correct' ? 'bg-green-500 text-white' :
                        grade === 'incorrect' ? 'bg-red-500 text-white' :
                        'bg-amber-500 text-white'
                      }`}>
                        {grade === 'correct' ? '✓' : grade === 'incorrect' ? '✗' : '~'}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-gray-800 truncate">{student.full_name}</p>
                    <p className="text-xs text-gray-400">
                      {!sub ? 'Not started' : grade ? grade : isDone ? 'Done ✓' : 'In progress'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Side panel: expanded view of selected student */}
        {selectedStudent && selectedSub && (
          <div className="w-80 border-l border-gray-200 bg-white flex flex-col flex-shrink-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 text-sm">
                {students.find(s => s.id === selectedStudent)?.full_name}
              </h2>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {selectedSub.canvas_data ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedSub.canvas_data} alt="Student work" className="w-full rounded-lg border border-gray-200" />
              ) : selectedSub.text_answer ? (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{selectedSub.text_answer}</div>
              ) : null}
              {selectedSub.updated_at && (
                <p className="text-xs text-gray-400 mt-2">
                  Last updated {new Date(selectedSub.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              <Link
                href={`/teacher/students/${selectedStudent}`}
                className="block mt-3 text-center text-sm text-purple-600 hover:underline"
              >
                View full profile →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
