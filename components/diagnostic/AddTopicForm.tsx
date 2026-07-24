'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddTopicForm({ diagnosticTestId }: { diagnosticTestId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [prepAdvice, setPrepAdvice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/diagnostic/admin/create-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosticTestId, title, prepAdvice }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
      setTitle(''); setPrepAdvice(''); setLoading(false)
      router.refresh()
    } catch {
      setError('Connection error.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <h3 className="font-bold text-gray-800">Add Topic</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Topic title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Stoichiometry & Mole Conversions"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prep advice <span className="text-gray-400 font-normal">(shown to students who score below mastery on this topic)</span>
        </label>
        <textarea value={prepAdvice} onChange={e => setPrepAdvice(e.target.value)} rows={2}
          placeholder="e.g. Review mole conversions and stoichiometry basics before Unit 1."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
        {loading ? 'Adding…' : 'Add Topic'}
      </button>
    </form>
  )
}
