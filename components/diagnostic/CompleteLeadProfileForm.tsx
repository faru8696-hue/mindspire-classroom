'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Shown on the public results page only when the lead's name/phone are
// still blank (see DiagnosticIntakeForm — deliberately not collected at
// intake). This is the higher-motivation moment to ask: they've already
// seen their results, so filling this in is optional, not a toll gate.
export default function CompleteLeadProfileForm({ attemptId }: { attemptId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/diagnostic/complete-lead-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          studentName: fd.get('studentName'),
          parentName: fd.get('parentName'),
          parentPhone: fd.get('parentPhone'),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
      setDone(true)
      router.refresh()
    } catch {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 text-center text-sm text-green-700 font-semibold">
        ✓ Thanks! We&rsquo;ll follow up with next steps.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 mb-4">
      <p className="font-bold text-gray-800 mb-1">Want a personal walkthrough of these results?</p>
      <p className="text-sm text-gray-500 mb-4">Add a few details and we&rsquo;ll follow up with next steps for your child.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="studentName" type="text" placeholder="Student full name"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800" />
        <input name="parentName" type="text" placeholder="Parent/guardian full name"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800" />
        <input name="parentPhone" type="tel" placeholder="Parent/guardian phone (optional)"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
          {loading ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
