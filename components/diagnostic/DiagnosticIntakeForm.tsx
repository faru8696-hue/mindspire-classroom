'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DiagnosticIntakeForm({ slug }: { slug: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/diagnostic/start-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          studentName: fd.get('studentName'),
          studentEmail: fd.get('studentEmail'),
          parentName: fd.get('parentName'),
          parentEmail: fd.get('parentEmail'),
          parentPhone: fd.get('parentPhone'),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); setLoading(false); return }
      router.push(`/diagnostic/${slug}/take/${data.attemptId}`)
    } catch {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-bold text-gray-700 mb-2">Student Information</p>
        <div className="space-y-3">
          <input name="studentName" type="text" required placeholder="Student full name"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800" />
          <input name="studentEmail" type="email" required placeholder="Student email"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800" />
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-700 mb-2">Parent/Guardian Information</p>
        <div className="space-y-3">
          <input name="parentName" type="text" required placeholder="Parent/guardian full name"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800" />
          <input name="parentEmail" type="email" required placeholder="Parent/guardian email"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800" />
          <input name="parentPhone" type="tel" required placeholder="Parent/guardian phone number"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800" />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition disabled:opacity-50">
        {loading ? 'Starting…' : 'Start Test →'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        This information helps us share results with you and your family. It will never be sold or shared with third parties.
      </p>
    </form>
  )
}
