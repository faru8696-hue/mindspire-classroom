'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Alert {
  id: string
  type: string
  student_name: string
  question_title: string
  class_id: string
  question_id: string
  created_at: string
}

export default function LiveNotificationFeed() {
  const supabase = createClient()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const audioRef = useRef<AudioContext | null>(null)

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
    const channel = supabase.channel('teacher-alerts', {
      config: { broadcast: { self: false } },
    })
      .on('broadcast', { event: 'student-alert' }, ({ payload }) => {
        const a = payload as Alert
        // Dedup: if this student already has an alert of the same type for
        // the same question, replace it (moves to top) instead of appending a
        // second entry — repeat clicks/re-broadcasts shouldn't pile up here.
        setAlerts(prev => [a, ...prev.filter(p => !(p.student_name === a.student_name && p.question_id === a.question_id && p.type === a.type))].slice(0, 20))
        playBeep()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (alerts.length === 0) return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="font-semibold text-gray-700 mb-2">🔔 Live Alerts</h2>
      <p className="text-sm text-gray-400">Waiting for students... alerts appear here in real time.</p>
    </div>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">🔔 Live Alerts</h2>
        <button onClick={() => setAlerts([])} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
      </div>
      <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        {alerts.map((a, i) => (
          <div key={a.id ?? i} className={`flex items-center gap-3 px-5 py-3 ${i === 0 ? 'bg-purple-50' : ''}`}>
            <span className="text-xl flex-shrink-0">{a.type === 'help' ? '🙋' : '✅'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{a.student_name}</p>
              <p className="text-xs text-gray-500">
                {a.type === 'help' ? 'needs help' : 'done — check their work'} · {a.question_title}
              </p>
            </div>
            <Link
              href={`/teacher/live/${a.class_id}/${a.question_id}`}
              className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex-shrink-0"
            >
              View class →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
