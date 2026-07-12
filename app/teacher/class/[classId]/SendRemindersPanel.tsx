'use client'

import { useState } from 'react'

// Two one-click sends: a "class is today" ping to everyone, and a digest
// email per student summarizing unfinished SUBTOPICS (not one email per
// question) plus anything due soon. Students with nothing pending are
// silently skipped from the digest, not spammed with an empty reminder.
export default function SendRemindersPanel({ classId }: { classId: string }) {
  const [sending, setSending] = useState<'today' | 'digest' | null>(null)
  const [result, setResult] = useState<{ sent: number; skipped: number; failed: number; errors: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [todayMessage, setTodayMessage] = useState('')

  async function send(type: 'today' | 'digest') {
    setSending(type)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, type, message: type === 'today' ? todayMessage || undefined : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send reminders')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminders')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h2 className="font-bold text-gray-800">📧 Email Reminders</h2>

      <div className="flex items-center gap-2">
        <input
          value={todayMessage}
          onChange={e => setTodayMessage(e.target.value)}
          placeholder="Optional note (e.g. bring a calculator)..."
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={() => send('today')}
          disabled={sending !== null}
          className="text-sm font-semibold px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 whitespace-nowrap"
        >
          {sending === 'today' ? 'Sending…' : '📅 Class is today'}
        </button>
      </div>

      <div>
        <button
          onClick={() => send('digest')}
          disabled={sending !== null}
          className="text-sm font-semibold px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
        >
          {sending === 'digest' ? 'Sending…' : '📚 Remind about unfinished subtopics + due dates'}
        </button>
        <p className="text-xs text-gray-400 mt-1">Skips any student with nothing pending — no empty reminders.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <p className="text-sm text-gray-600">
          ✓ Sent {result.sent}, skipped {result.skipped} (nothing pending or no email on file){result.failed > 0 && `, ${result.failed} failed`}
          {result.errors.length > 0 && <span className="block text-xs text-red-500 mt-1">{result.errors[0]}</span>}
        </p>
      )}
    </div>
  )
}
