'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Notif {
  id: string
  grade: string
  feedback: string | null
  question_id: string
  question_title: string
  href: string
  created_at: string
  read: boolean
}

const GRADE_STYLE: Record<string, { icon: string; cls: string; label: string }> = {
  correct:    { icon: '✅', cls: 'border-green-400 bg-green-50',   label: 'Correct!' },
  partial:    { icon: '🟡', cls: 'border-amber-400 bg-amber-50',   label: 'Partially correct' },
  discussed:  { icon: '💬', cls: 'border-blue-400 bg-blue-50',     label: 'Discussed' },
  incorrect:  { icon: '❌', cls: 'border-red-400 bg-red-50',       label: 'Incorrect' },
  needsmore:  { icon: '🔄', cls: 'border-purple-400 bg-purple-50', label: 'Needs more work' },
  comment:    { icon: '💬', cls: 'border-blue-300 bg-blue-50',     label: 'Teacher comment' },
  assignment: { icon: '📋', cls: 'border-purple-300 bg-purple-50', label: 'New assignment' },
}

export default function StudentGradeNotifications({ studentId }: { studentId: string }) {
  const supabase = createClient()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const audioRef = useRef<AudioContext | null>(null)

  function playTone(freq: number) {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const play = () => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(); osc.stop(ctx.currentTime + 0.5)
      }
      if (ctx.state === 'suspended') { ctx.resume().then(play) } else { play() }
    } catch {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildNotif(n: any): Notif {
    const q = Array.isArray(n.questions) ? n.questions[0] : n.questions
    const topic = Array.isArray(q?.topics) ? q.topics[0] : q?.topics
    const unit = Array.isArray(topic?.units) ? topic.units[0] : topic?.units
    const cls = Array.isArray(unit?.classes) ? unit.classes[0] : unit?.classes
    const href = cls?.id && unit?.id && topic?.id && q?.id
      ? `/student/${cls.id}/${unit.id}/${topic.id}/${q.id}`
      : '/student/assignments'
    const gradeKey = n.type === 'assignment' ? 'assignment' : (n.grade ?? (n.type === 'comment' ? 'comment' : 'comment'))
    return { id: n.id, grade: gradeKey, feedback: n.feedback, question_id: n.question_id, question_title: q?.title ?? 'Question', href, created_at: n.created_at, read: n.read }
  }

  useEffect(() => {
    supabase
      .from('student_notifications')
      .select('id, grade, feedback, read, created_at, question_id, questions(id, title, topic_id, topics(id, unit_id, units(id, class_id, classes(id, title))))')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data?.length) setNotifs(data.map(buildNotif)) })
  }, [studentId])

  useEffect(() => {
    const ch = supabase.channel(`dashboard-notifs:${studentId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'student_notifications',
      }, async (payload) => {
        const row = payload.new as { id: string; student_id: string; grade: string | null; question_id: string }
        if (row.student_id !== studentId) return
        const { data } = await supabase
          .from('student_notifications')
          .select('id, grade, feedback, read, created_at, question_id, questions(id, title, topic_id, topics(id, unit_id, units(id, class_id, classes(id, title))))')
          .eq('id', row.id)
          .single()
        if (!data) return
        setNotifs(prev => [buildNotif(data), ...prev.filter(n => n.id !== row.id).slice(0, 4)])
        playTone(!row.grade || row.grade === 'comment' ? 740 : row.grade === 'correct' ? 660 : row.grade === 'partial' ? 520 : 330)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [studentId])

  if (notifs.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-700">Recent Feedback</h2>
        <Link href="/student/notifications" className="text-xs text-purple-600 hover:underline">View all →</Link>
      </div>
      <div className="space-y-2">
        {notifs.map(n => {
          const style = GRADE_STYLE[n.grade] ?? { icon: '📝', cls: 'border-gray-300 bg-gray-50', label: n.grade }
          return (
            <Link key={n.id} href={n.href} className={`flex items-center gap-3 border-l-4 rounded-xl px-4 py-3 hover:opacity-80 transition-opacity ${style.cls} ${!n.read ? 'ring-2 ring-purple-200' : ''}`}>
              <span className="text-xl flex-shrink-0">{style.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{n.question_title}</p>
                <p className="text-xs text-gray-600">{style.label}{n.feedback ? ` — ${n.feedback}` : ''}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">View →</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
