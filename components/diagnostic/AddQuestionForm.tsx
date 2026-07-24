'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AddQuestionForm({
  diagnosticTestId, topics,
}: {
  diagnosticTestId: string
  topics: { id: string; title: string }[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '')
  const [content, setContent] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id) })
  }, [])

  function setOption(i: number, value: string) {
    setOptions(prev => prev.map((o, idx) => (idx === i ? value : o)))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingImage(true)
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('question-images').upload(path, file, { upsert: true })
    if (!uploadError) {
      const { data } = supabase.storage.from('question-images').getPublicUrl(path)
      setImageUrl(data.publicUrl)
    } else {
      alert(`Image upload failed: ${uploadError.message}`)
    }
    setUploadingImage(false)
    e.target.value = ''
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional, for diagrams)</label>
        {imageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Question diagram" className="w-full rounded-lg border border-gray-200 max-h-48 object-contain bg-gray-50" />
            <button type="button" onClick={() => setImageUrl('')}
              className="absolute top-1 right-1 bg-white/90 rounded-full w-6 h-6 text-gray-600 hover:text-red-500 text-xs shadow flex items-center justify-center">✕</button>
          </div>
        ) : (
          <label className="block w-full text-center border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-pointer hover:border-blue-400 hover:text-blue-600 mb-2">
            {uploadingImage ? 'Uploading…' : '📷 Upload image'}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        )}
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="…or paste an image URL"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
      <button type="submit" disabled={loading || uploadingImage || topics.length === 0}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
        {loading ? 'Adding…' : 'Add Question'}
      </button>
    </form>
  )
}
