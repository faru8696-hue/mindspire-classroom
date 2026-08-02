'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ActiveToggle({ testId, isActive }: { testId: string; isActive: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function toggle() {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/set-test-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, isActive: !isActive }),
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
        title={isActive ? 'Visible to students — click to hide it' : 'Hidden from students — click to release it'}
        className={`text-sm font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-50 ${
          isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {saving ? 'Saving…' : isActive ? '🟢 Active' : '⚪ Inactive'}
      </button>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}
