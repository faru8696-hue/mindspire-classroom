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
  const audioRef = useRef<AudioContext | null>(null)

  const unread = notifications.filter(n => !n.read)

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
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  useEffect(() => {
    // Use Broadcast channel — no RLS, instant delivery
    const channel = supabase.channel('teacher-alerts', {
      config: { broadcast: { self: false } },
    })
      .on('broadcast', { event: 'student-alert' }, ({ payload }) => {
        const n = payload as Notification
        setNotifications(prev => [{ ...n, read: false }, ...prev.slice(0, 49)])
        playBeep()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    const ids = unread.map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
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
                  <span className="text-lg flex-shrink-0 mt-0.5">{n.type === 'help' ? '🙋' : '✅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {n.student_name ?? 'A student'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {n.type === 'help' ? 'needs help' : 'is done — check their work'}
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
    </div>
  )
}
