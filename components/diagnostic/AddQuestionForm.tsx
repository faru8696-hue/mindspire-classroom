'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddQuestionForm({
  diagnosticTestId, topics,
}: {
  diagnosticTestId: string
  topics: { id: string; title: string }[]
}) {
  const router = useRouter()
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '')
  const [content, setContent] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function setOption(i: number, value: string) {
    setOptions(prev => prev.map((o, idx) => (idx === i ? value : o)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const trimmedOptions = options.map(o => o.trim()).filter(Boolean)
    if (trimmedOptions.length < 2) { setError('At least 2 non-empty options are required.'); return }
    if (!topicId) { setError('Add a topic first.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/diagnostic/admin/create-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosticTestId, topicId, content,
          options: trimmedOptions, correctIndex,
          imageUrl: imageUrl || undefined, source: source || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
      setContent(''); setOptions(['', '', '', '']); setCorrectIndex(0); setImageUrl(''); setSource(''); setLoading(false)
      router.refresh()
    } catch {
      setError('Connection error.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <h3 className="font-bold text-gray-800">Add Question</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
        <select value={topicId} onChange={e => setTopicId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} required rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional, for diagrams)</label>
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://…"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Options — mark the correct one</label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correctIndex" checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
            <span className="text-sm font-bold text-gray-500 w-5">{String.fromCharCode(65 + i)}</span>
            <input value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Source (optional)</label>
        <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Chapter 1 Practice Test"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={loading || topics.length === 0}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
        {loading ? 'Adding…' : 'Add Question'}
      </button>
    </form>
  )
}
