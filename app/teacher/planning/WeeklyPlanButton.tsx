'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { WeeklyPlanSession, UnmatchedTopicNote } from '@/lib/gemini'
import { CLASS_TIME } from '@/lib/classSchedule'

export interface InitialWeeklyPlan {
  sessions: WeeklyPlanSession[]
  feasibilityNote: string | null
  shared: boolean
  generatedAt: string
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

function formatSessionDate(iso: string | undefined): string {
  if (!iso) return 'Unknown date'
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function WeeklyPlanButton({ classId, initialPlan }: { classId: string; initialPlan: InitialWeeklyPlan | null }) {
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sessions, setSessions] = useState<WeeklyPlanSession[] | null>(initialPlan?.sessions ?? null)
  const [feasibilityNote, setFeasibilityNote] = useState<string | null>(initialPlan?.feasibilityNote ?? null)
  const [unmatchedTopicNotes, setUnmatchedTopicNotes] = useState<UnmatchedTopicNote[]>([])
  const [shared, setShared] = useState(initialPlan?.shared ?? false)
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialPlan?.generatedAt ?? null)
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
      setUnmatchedTopicNotes(data.unmatchedTopicNotes ?? [])
      setGeneratedAt(data.generatedAt ?? new Date().toISOString())
      setShared(data.shared ?? false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function deletePlan() {
    setDeleting(true)
    const res = await fetch('/api/delete-weekly-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId }),
    })
    setDeleting(false)
    if (res.ok) {
      setSessions(null)
      setFeasibilityNote(null)
      setUnmatchedTopicNotes([])
      setGeneratedAt(null)
      setShared(false)
    }
  }

  async function toggleShare() {
    const next = !shared
    setSharing(true)
    const res = await fetch('/api/share-weekly-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, shared: next }),
    })
    setSharing(false)
    if (res.ok) setShared(next)
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={getPlan}
          disabled={loading}
          className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Thinking…' : sessions ? '🔄 Get New Plan' : '🤖 Get Study Plan'}
        </button>

        {sessions && (
          <>
            <button
              onClick={toggleShare}
              disabled={sharing}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 ${
                shared ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {sharing ? 'Saving…' : shared ? '✓ Shared with students' : '📤 Share with students'}
            </button>
            <button
              onClick={deletePlan}
              disabled={deleting}
              className="text-xs font-semibold text-gray-400 hover:text-red-500 px-2 py-1.5 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : '🗑️ Delete'}
            </button>
            {generatedAt && <span className="text-xs text-gray-400">Generated {timeAgo(generatedAt)}</span>}
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {sessions && (
        <div className="mt-2 space-y-2">
          {feasibilityNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
              ⚠️ {feasibilityNote}
            </div>
          )}
          {unmatchedTopicNotes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-800">
              <p className="font-semibold mb-1.5">📌 These &quot;other topics&quot; notes don&apos;t match anything in your curriculum yet:</p>
              <ul className="space-y-1.5">
                {unmatchedTopicNotes.map((u, i) => (
                  <li key={i}>
                    <span className="italic">&quot;{u.note}&quot;</span> — {u.suggestion}
                  </li>
                ))}
              </ul>
              <Link href="/teacher/content" className="inline-block mt-1.5 text-xs font-semibold underline hover:no-underline">
                Add topics →
              </Link>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-3">Nothing to suggest yet — no students have reported topics for this class.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {sessions.map((s, i) => (
                  <div key={i} className="px-4 py-2.5 text-sm">
                    <p className="font-semibold text-gray-800">{s.dayLabel || formatSessionDate(s.date)} <span className="font-normal text-gray-400">· {CLASS_TIME}</span></p>
                    <p className="text-gray-600 mt-0.5">{s.focusTopics.join(', ')}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.rationale}</p>
                    {s.homeworkSuggestion && (
                      <p className="text-xs text-purple-700 bg-purple-50 rounded-lg px-2.5 py-1.5 mt-1.5">
                        📝 Homework for the off days: {s.homeworkSuggestion}
                      </p>
                    )}
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
