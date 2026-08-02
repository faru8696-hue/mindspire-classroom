'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteTestButton({ testId, title }: { testId: string; title: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    if (!window.confirm(`Permanently delete "${title}"? This removes every topic, question, student entry, and attempt under this test — it cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/diagnostic/admin/delete-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Something went wrong.'); setDeleting(false); return }
      router.push('/teacher/diagnostics')
    } catch {
      alert('Connection error.')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={remove}
      disabled={deleting}
      className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-semibold transition disabled:opacity-50"
    >
      {deleting ? 'Deleting…' : '🗑 Delete Test'}
    </button>
  )
}
