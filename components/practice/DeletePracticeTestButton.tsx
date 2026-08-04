'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePracticeTestButton({ testId, studentDisplayName, title }: { testId: string; studentDisplayName: string; title: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    if (!window.confirm(`Permanently delete ${studentDisplayName}'s "${title}" self-study test? This removes the test and their answers — it cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/practice/admin/delete-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Something went wrong.'); setDeleting(false); return }
      router.push('/teacher/practice-tests')
    } catch {
      alert('Connection error.')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={remove}
      disabled={deleting}
      className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-50 flex-shrink-0"
    >
      {deleting ? 'Deleting…' : '🗑 Delete test'}
    </button>
  )
}
