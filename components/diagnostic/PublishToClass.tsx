'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishToClass({
  testId, classId, classes,
}: {
  testId: string
  classId: string | null
  classes: { id: string; title: string }[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(newClassId: string) {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/set-test-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, classId: newClassId || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSaving(false); return }
      setSaving(false)
      router.refresh()
    } catch {
      setError('Connection error.')
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-3 flex-wrap">
      <span className="text-sm font-semibold text-gray-700">📌 Publish to class:</span>
      <select
        value={classId ?? ''}
        onChange={e => handleChange(e.target.value)}
        disabled={saving}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="">Not published (public link only)</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>
      {saving && <span className="text-xs text-gray-400">Saving…</span>}
      {classId && !saving && (
        <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-semibold">
          ✓ Visible in that class's student view
        </span>
      )}
      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg w-full">{error}</p>}
    </div>
  )
}
