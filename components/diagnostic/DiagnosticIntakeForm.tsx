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
          parentEmail: fd.get('parentEmail'),
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
      <input name="parentEmail" type="email" required placeholder="Parent/guardian email"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800" />

      {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition disabled:opacity-50">
        {loading ? 'Starting…' : 'Start Test →'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        We&rsquo;ll send your results here. It will never be sold or shared with third parties.
      </p>
    </form>
  )
}
