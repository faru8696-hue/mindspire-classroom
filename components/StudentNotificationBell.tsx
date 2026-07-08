'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Notif {
  id: string
  type: string
  grade: string | null
  feedback: string | null
  count?: number
  question_title: string
  class_title: string | null
  href: string
  created_at: string
  read: boolean
}

const ICON: Record<string, string> = {
  correct: '✅', partial: '🟡', discussed: '💬', incorrect: '❌', needsmore: '🔄',
  comment: '💬', assignment: '📋',
}

function iconFor(n: Notif): string {
  if (n.type === 'assignment') return ICON.assignment
  if (n.type === 'comment') return ICON.comment
  return ICON[n.grade ?? ''] ?? '📝'
}

function titleFor(n: Notif): string {
  if (n.type === 'assignment') return n.count && n.count > 1 ? `${n.count} new questions assigned` : 'New question assigned'
  if (n.type === 'comment') return 'Teacher left a comment'
  return 'Teacher graded your work'
}

export default function StudentNotificationBell({ studentId }: { classIds?: string[], studentId: string }) {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [open, setOpen] = useState(false)
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

  async function load() {
    try {
      const res = await fetch('/api/student-notifications')
      if (!res.ok) return
      const { notifications } = await res.json() as { notifications: Notif[] }
      if (!firstLoad.current) {
        const fresh = notifications.filter(n => !seen.current.has(n.id))
        if (fresh.length) {
          const g = fresh[0].grade
          playTone(fresh[0].type === 'assignment' ? 520 : !g || g === 'comment' ? 740 : g === 'correct' ? 660 : g === 'partial' ? 520 : 330)
        }
      }
      notifications.forEach(n => seen.current.add(n.id))
      firstLoad.current = false
      setNotifs(notifications)
    } catch {}
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [studentId])

  const unread = notifs.filter(n => !n.read).length

  async function handleOpen() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      const ids = notifs.filter(n => !n.read).map(n => n.id)
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
      fetch('/api/student-notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }).catch(() => {})
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-1.5 rounded-lg hover:bg-purple-800 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Notifications</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
          {notifs.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-400 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {notifs.slice(0, 12).map(n => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-purple-50 transition-colors"
                >
                  <span className="text-lg flex-shrink-0">{iconFor(n)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{titleFor(n)}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {n.type === 'assignment'
                        ? (n.count && n.count > 1 ? `Latest: ${n.question_title}` : n.question_title)
                        : `${n.question_title}${n.feedback ? ` — ${n.feedback}` : ''}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link href="/student/notifications" onClick={() => setOpen(false)} className="block text-center text-xs text-purple-600 hover:underline py-2 border-t border-gray-100">
            View all →
          </Link>
        </div>
      )}
    </div>
  )
}
