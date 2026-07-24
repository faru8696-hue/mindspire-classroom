'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TestTitleEditor({
  testId, title, description,
}: {
  testId: string
  title: string
  description: string | null
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftDescription, setDraftDescription] = useState(description ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!draftTitle.trim()) { setError('Title is required.'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/update-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, title: draftTitle.trim(), description: draftDescription.trim() || undefined }),
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
    setDraftTitle(title)
    setDraftDescription(description ?? '')
    setError('')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-blue-300 p-4 mb-1 space-y-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
          <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Description (shown to students)</label>
          <textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
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
    <div className="flex items-center gap-3 mb-1">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">Mindspire Lab</span>
      <button onClick={() => setEditing(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
        ✏️ Rename
      </button>
    </div>
  )
}
