'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReleaseResultsToggle({ attemptId, released }: { attemptId: string; released: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function toggle() {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/release-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, released: !released }),
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
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={saving}
        title={released ? 'Student can see their score — click to hide it again' : "Hidden from the student — click to share their score"}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-50 whitespace-nowrap ${
          released ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
        }`}
      >
        {saving ? 'Saving…' : released ? '✓ Results shared with student' : '🔒 Results hidden — click to share'}
      </button>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}
