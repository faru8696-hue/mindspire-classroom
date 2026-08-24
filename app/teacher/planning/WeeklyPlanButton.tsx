'use client'

import { useState } from 'react'
import type { WeeklyPlanSession } from '@/lib/gemini'

export default function WeeklyPlanButton({ classId }: { classId: string }) {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<WeeklyPlanSession[] | null>(null)
  const [feasibilityNote, setFeasibilityNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function getPlan() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/suggest-weekly-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSessions(data.sessions)
      setFeasibilityNote(data.feasibilityNote ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-3">
      <button
        onClick={getPlan}
        disabled={loading}
        className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Thinking…' : "🤖 Get This Week's Plan"}
      </button>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {sessions && (
        <div className="mt-2 space-y-2">
          {feasibilityNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
              ⚠️ {feasibilityNote}
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-3">Nothing to suggest yet — no students have reported topics for this class.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {sessions.map((s, i) => (
                  <div key={i} className="px-4 py-2.5 text-sm">
                    <p className="font-semibold text-gray-800">{s.day}</p>
                    <p className="text-gray-600 mt-0.5">{s.focusTopics.join(', ')}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
