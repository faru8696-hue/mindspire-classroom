'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmEmailActions({ token }: { token: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<'confirm' | 'cancel' | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState<'sent' | 'cancelled' | null>(null)

  async function run(action: 'confirm' | 'cancel') {
    setError('')
    setBusy(action)
    try {
      const res = await fetch(`/api/diagnostic/admin/${action === 'confirm' ? 'confirm-send-email' : 'cancel-pending-email'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setBusy(null); return }
      setDone(action === 'confirm' ? 'sent' : 'cancelled')
      router.refresh()
    } catch {
      setError('Connection error.')
      setBusy(null)
    }
  }

  if (done === 'sent') {
    return <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 font-semibold text-center">✓ Sent to the student and parent.</div>
  }
  if (done === 'cancelled') {
    return <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-600 font-semibold text-center">This email was cancelled — nothing was sent.</div>
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => run('confirm')}
          disabled={busy !== null}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50"
        >
          {busy === 'confirm' ? 'Sending…' : 'Confirm & Send to Parent'}
        </button>
        <button
          onClick={() => run('cancel')}
          disabled={busy !== null}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          {busy === 'cancel' ? 'Cancelling…' : 'Cancel'}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
