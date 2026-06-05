'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface GradeNotif {
  id: string
  grade: string
  feedback: string
  question_title: string
  question_id: string
  class_id: string
  unit_id: string
  topic_id: string
  seen: boolean
  created_at: string
}

const GRADE_STYLE: Record<string, { icon: string; cls: string; label: string }> = {
  correct:   { icon: '✅', cls: 'border-green-400 bg-green-50',   label: 'Correct!' },
  partial:   { icon: '🟡', cls: 'border-amber-400 bg-amber-50',   label: 'Partially correct' },
  discussed: { icon: '💬', cls: 'border-blue-400 bg-blue-50',     label: 'Discussed' },
  incorrect: { icon: '❌', cls: 'border-red-400 bg-red-50',       label: 'Incorrect' },
  needsmore: { icon: '🔄', cls: 'border-purple-400 bg-purple-50', label: 'Needs more work' },
}

export default function StudentGradeNotifications({ studentId }: { studentId: string }) {
  const supabase = createClient()
  const [notifs, setNotifs] = useState<GradeNotif[]>([])
  const audioRef = useRef<AudioContext | null>(null)

  function playTone(freq: number) {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(); osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  // Load recent graded feedback on mount
  useEffect(() => {
    async function load() {
      const { data: subs } = await supabase
        .from('submissions')
        .select('id, question_id, questions(id, title, topic_id, topics(id, unit_id, units(id, class_id)))')
        .eq('student_id', studentId)

      if (!subs?.length) return

      const subIds = subs.map(s => s.id)
      const { data: feedbacks } = await supabase
        .from('feedback')
        .select('submission_id, grade, text_feedback, created_at')
        .in('submission_id', subIds)
        .not('grade', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!feedbacks?.length) return

      const items: GradeNotif[] = feedbacks.map(f => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = subs.find(s => s.id === f.submission_id) as any
        const q = Array.isArray(sub?.questions) ? sub.questions[0] : sub?.questions
        const topic = Array.isArray(q?.topics) ? q.topics[0] : q?.topics
        const unit = Array.isArray(topic?.units) ? topic.units[0] : topic?.units
        return {
          id: f.submission_id,
          grade: f.grade,
          feedback: f.text_feedback ?? '',
          question_title: q?.title ?? 'Question',
          question_id: q?.id ?? '',
          topic_id: topic?.id ?? '',
          unit_id: unit?.id ?? '',
          class_id: unit?.class_id ?? '',
          seen: true,
          created_at: f.created_at,
        }
      })
      setNotifs(items)
    }
    load()
  }, [studentId])

  // Live listener for new grades
  useEffect(() => {
    const ch = supabase.channel(`dashboard-grades:${studentId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'feedback',
      }, async (payload) => {
        const row = payload.new as { submission_id: string; grade: string | null; text_feedback: string | null; created_at: string }
        if (!row.grade) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sub } = await supabase.from('submissions').select('question_id, student_id, questions(id, title, topic_id, topics(id, unit_id, units(id, class_id)))').eq('id', row.submission_id).single() as any
        if (!sub || sub.student_id !== studentId) return
        const q = Array.isArray(sub.questions) ? sub.questions[0] : sub.questions
        const topic = Array.isArray(q?.topics) ? q.topics[0] : q?.topics
        const unit = Array.isArray(topic?.units) ? topic.units[0] : topic?.units
        setNotifs(prev => [{
          id: row.submission_id + Date.now(),
          grade: row.grade!,
          feedback: row.text_feedback ?? '',
          question_title: q?.title ?? 'Question',
          question_id: q?.id ?? '',
          topic_id: topic?.id ?? '',
          unit_id: unit?.id ?? '',
          class_id: unit?.class_id ?? '',
          seen: false,
          created_at: row.created_at,
        }, ...prev.slice(0, 4)])
        playTone(row.grade === 'correct' ? 660 : row.grade === 'partial' ? 520 : 330)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [studentId])

  if (notifs.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-gray-700 mb-3">Recent Feedback</h2>
      <div className="space-y-2">
        {notifs.map(n => {
          const style = GRADE_STYLE[n.grade] ?? { icon: '📝', cls: 'border-gray-300 bg-gray-50', label: n.grade }
          const href = n.class_id && n.unit_id && n.topic_id && n.question_id
            ? `/student/${n.class_id}/${n.unit_id}/${n.topic_id}/${n.question_id}`
            : '/student/assignments'
          return (
            <Link
              key={n.id}
              href={href}
              className={`flex items-center gap-3 border-l-4 rounded-xl px-4 py-3 hover:opacity-80 transition-opacity ${style.cls} ${!n.seen ? 'ring-2 ring-purple-300' : ''}`}
            >
              <span className="text-2xl flex-shrink-0">{style.icon}</span>
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
