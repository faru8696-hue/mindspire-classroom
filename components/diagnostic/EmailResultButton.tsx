'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EmailResultButton({
  attemptId, studentEmail, parentEmail,
}: {
  attemptId: string
  studentEmail: string
  parentEmail: string
}) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!window.confirm(`Email these results to:\n• ${studentEmail}\n• ${parentEmail}`)) return
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/diagnostic/admin/email-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSending(false); return }
      setSent(true)
      setTimeout(() => setSent(false), 5000)
      // Sending the email also releases the results (see the API route) —
      // refresh so the release toggle next to this button picks that up.
      router.refresh()
    } catch {
      setError('Connection error.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <button
        onClick={send}
        disabled={sending}
        className={`text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-50 ${
          sent ? 'bg-green-100 text-green-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {sending ? 'Sending…' : sent ? '✓ Sent' : '✉️ Email Results to Student & Parent'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
