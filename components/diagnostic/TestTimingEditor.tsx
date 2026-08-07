'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TestTimingEditor({
  testId, title, durationMinutes, allowOvertime,
}: {
  testId: string
  title: string
  durationMinutes: number
  allowOvertime: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draftMinutes, setDraftMinutes] = useState(String(durationMinutes))
  const [draftOvertime, setDraftOvertime] = useState(allowOvertime)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    const minutes = Number(draftMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) { setError('Enter a positive number of minutes.'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/update-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, title, durationMinutes: minutes, allowOvertime: draftOvertime }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSaving(false); return }
      setSaving(false)
      setEditing(false)
      router.refresh()
    } catch {
      setError('Connection error.')
      setSaving(false)
    }
  }

  function cancel() {
    setDraftMinutes(String(durationMinutes))
    setDraftOvertime(allowOvertime)
    setError('')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-blue-300 p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Time limit (minutes)</label>
          <input
            type="number"
            min={1}
            value={draftMinutes}
            onChange={e => setDraftMinutes(e.target.value)}
            className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={draftOvertime} onChange={e => setDraftOvertime(e.target.checked)} className="mt-0.5" />
          <span>
            Allow students to keep answering after time runs out
            <span className="block text-xs text-gray-400 mt-0.5">
              The timer still counts down, but reaching 0:00 won&rsquo;t auto-submit. Anything answered after time&rsquo;s up is flagged for you to accept or reject before it can be released to the student.
            </span>
          </span>
        </label>
        {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={cancel} disabled={saving}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-1.5 rounded-lg transition disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span>⏱ {durationMinutes} min{allowOvertime ? ' · overtime allowed' : ''}</span>
      <button onClick={() => setEditing(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
        ✏️ Edit timing
      </button>
    </div>
  )
}
