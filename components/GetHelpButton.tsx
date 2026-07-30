'use client'

import { useState } from 'react'

// Same /api/student-alert endpoint the live board's "🙋 Get Help" button
// uses — this just lets a student raise that same flag asynchronously, from
// their own submission history, instead of only while a teacher happens to
// be watching the live board for that exact question.
export default function GetHelpButton({ studentId, questionId, classId }: { studentId: string; questionId: string; classId: string }) {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleClick() {
    setSending(true)
    try {
      await fetch('/api/student-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'help', studentId, questionId, classId }),
      })
      setSent(true)
      setTimeout(() => setSent(false), 5000)
    } finally {
      setSending(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={sending}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
        sent ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
      }`}
    >
      {sent ? '✓ Sent' : '🙋 Get Help'}
    </button>
  )
}
