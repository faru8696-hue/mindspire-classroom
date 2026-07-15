'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Notif {
  id: string
  type: string
  grade: string | null
  feedback: string | null
  question_title: string
  class_title: string | null
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
  answer_key_released: { icon: '🔓', cls: 'border-purple-400 bg-purple-50', label: 'Answer key released' },
}

function styleKey(n: Notif): string {
  if (n.type === 'assignment') return 'assignment'
  if (n.type === 'comment') return 'comment'
  if (n.type === 'answer_key_released') return 'answer_key_released'
  return n.grade ?? 'comment'
}

export default function StudentGradeNotifications({ studentId }: { studentId: string }) {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const seen = useRef<Set<string>>(new Set())
  const firstLoad = useRef(true)
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

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/student-notifications')
        if (!res.ok) return
        const { notifications } = await res.json() as { notifications: Notif[] }
        if (!active) return
        // Play a tone for newly-seen notifications (skip the very first load)
        if (!firstLoad.current) {
          const fresh = notifications.filter(n => !seen.current.has(n.id))
          if (fresh.length) {
            const g = fresh[0].grade
            playTone(fresh[0].type === 'assignment' ? 520 : !g || g === 'comment' ? 740 : g === 'correct' ? 660 : g === 'partial' ? 520 : 330)
          }
        }
        notifications.forEach(n => seen.current.add(n.id))
        firstLoad.current = false
        setNotifs(notifications.slice(0, 5))
      } catch {}
    }
    load()
    const interval = setInterval(load, 15000)
    return () => { active = false; clearInterval(interval) }
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
          const style = GRADE_STYLE[styleKey(n)] ?? { icon: '📝', cls: 'border-gray-300 bg-gray-50', label: n.grade ?? 'Update' }
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
