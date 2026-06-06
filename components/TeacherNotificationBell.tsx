'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  student_id: string
  question_id: string
  class_id: string
  created_at: string
  read: boolean
  student_name?: string
  question_title?: string
}

interface Props {
  initialNotifications: Notification[]
}

export default function TeacherNotificationBell({ initialNotifications }: Props) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [open, setOpen] = useState(false)
  const [toasts, setToasts] = useState<Notification[]>([])
  const audioRef = useRef<AudioContext | null>(null)
  // Track which notification ids we've already surfaced, so the broadcast
  // (instant) and the polling fallback (durable) never double-toast.
  const seenRef = useRef<Set<string>>(new Set(initialNotifications.map(n => n.id)))

  // Seed from server on mount (layout data can be stale) — no toasts for existing.
  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(({ notifications: fresh }) => {
        if (fresh?.length) {
          fresh.forEach((n: Notification) => seenRef.current.add(n.id))
          setNotifications(fresh)
        }
      })
      .catch(() => {})
  }, [])

  const unread = notifications.filter(n => !n.read)

  function playBeep() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(); osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  function dismissToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Surface a fresh notification: toast + beep + relay to any live view.
  function surface(n: Notification) {
    setToasts(prev => [{ ...n }, ...prev].slice(0, 5))
    playBeep()
    setTimeout(() => dismissToast(n.id), 12000)
    window.dispatchEvent(new CustomEvent('teacher-student-alert', { detail: n }))
  }

  // Instant path: realtime broadcast from the student.
  useEffect(() => {
    const channel = supabase.channel('teacher-alerts', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'student-alert' }, ({ payload }) => {
        const n = payload as Notification
        if (seenRef.current.has(n.id)) return
        seenRef.current.add(n.id)
        setNotifications(prev => [{ ...n, read: false }, ...prev.slice(0, 49)])
        surface(n)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Durable fallback: poll the server so missed broadcasts (backgrounded
  // tab, idle socket, navigating between pages) still get surfaced.
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/notifications')
        const { notifications: fresh } = await res.json()
        if (!fresh?.length) return
        setNotifications(prev => {
          const map = new Map(prev.map(n => [n.id, n]))
          for (const n of fresh as Notification[]) map.set(n.id, n)
          return [...map.values()]
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .slice(0, 50)
        })
        // Oldest first so the newest toast lands on top.
        for (const n of [...(fresh as Notification[])].reverse()) {
          if (!seenRef.current.has(n.id)) {
            seenRef.current.add(n.id)
            if (!n.read) surface(n)
          }
        }
      } catch {}
    }
    const id = setInterval(poll, 12000)
    return () => clearInterval(id)
  }, [])

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) }).catch(() => {})
  }

  async function markAllRead() {
    const ids = unread.map(n => n.id)
    if (!ids.length) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).catch(() => {})
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-purple-800 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                Notifications {unread.length > 0 && <span className="text-purple-600">({unread.length} new)</span>}
              </h3>
              {unread.length > 0 && (
                <button onClick={markAllRead} className="text-xs text-purple-600 hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
              ) : notifications.slice(0, 30).map((n, i) => (
                <div
                  key={n.id ?? i}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${n.read ? '' : 'bg-purple-50'}`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{n.type === 'help' ? '🙋' : n.type === 'comment' ? '💬' : '✅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {n.student_name ?? 'A student'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {n.type === 'help' ? 'needs help' : n.type === 'comment' ? 'left a comment' : 'is done — check their work'}
                    </p>
                    {n.question_title && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{n.question_title}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                    <Link
                      href={`/teacher/live/${n.class_id}/${n.question_id}`}
                      onClick={() => { markRead(n.id); setOpen(false) }}
                      className="text-xs bg-purple-600 text-white px-2 py-1 rounded-lg hover:bg-purple-700 whitespace-nowrap"
                    >
                      View class
                    </Link>
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {/* Floating toasts — visible on any page */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-72">
          {toasts.map(t => (
            <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
              t.type === 'help'
                ? 'bg-amber-500 border-amber-400 text-white'
                : t.type === 'comment'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-purple-600 border-purple-500 text-white'
            }`}>
              <span className="text-xl flex-shrink-0">{t.type === 'help' ? '🙋' : t.type === 'comment' ? '💬' : '✅'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{t.student_name ?? 'A student'}</p>
                <p className="text-xs opacity-90">{t.type === 'help' ? 'needs help' : t.type === 'comment' ? 'left a comment' : 'done — check their work'}</p>
                {t.question_title && <p className="text-xs opacity-75 truncate">{t.question_title}</p>}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0 items-end">
                <Link
                  href={`/teacher/live/${t.class_id}/${t.question_id}`}
                  onClick={() => dismissToast(t.id)}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg whitespace-nowrap"
                >
                  View →
                </Link>
                <button onClick={() => dismissToast(t.id)} className="text-xs opacity-60 hover:opacity-100">dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
