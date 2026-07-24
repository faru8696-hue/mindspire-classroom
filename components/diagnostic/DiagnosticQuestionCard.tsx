'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface DiagnosticQuestionCardData {
  id: string
  topic_id: string
  content: string
  mcq_options: string[]
  mcq_correct_index: number
  image_url: string | null
  source: string | null
  is_active: boolean
}

export default function DiagnosticQuestionCard({
  question, topics, topicTitle,
}: {
  question: DiagnosticQuestionCardData
  topics: { id: string; title: string }[]
  topicTitle: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [topicId, setTopicId] = useState(question.topic_id)
  const [content, setContent] = useState(question.content)
  const [options, setOptions] = useState<string[]>(
    question.mcq_options.length >= 4 ? question.mcq_options : [...question.mcq_options, '', '', '', ''].slice(0, 4)
  )
  const [correctIndex, setCorrectIndex] = useState(question.mcq_correct_index)
  const [imageUrl, setImageUrl] = useState(question.image_url ?? '')
  const [source, setSource] = useState(question.source ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function setOption(i: number, value: string) {
    setOptions(prev => prev.map((o, idx) => (idx === i ? value : o)))
  }

  function cancelEdit() {
    setTopicId(question.topic_id)
    setContent(question.content)
    setOptions(question.mcq_options.length >= 4 ? question.mcq_options : [...question.mcq_options, '', '', '', ''].slice(0, 4))
    setCorrectIndex(question.mcq_correct_index)
    setImageUrl(question.image_url ?? '')
    setSource(question.source ?? '')
    setError('')
    setEditing(false)
  }

  async function save() {
    setError('')
    const trimmedOptions = options.map(o => o.trim()).filter(Boolean)
    if (trimmedOptions.length < 2) { setError('At least 2 non-empty options are required.'); return }
    if (correctIndex >= trimmedOptions.length) { setError('The correct answer must be one of the remaining options.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/update-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id, topicId, content,
          options: trimmedOptions, correctIndex,
          imageUrl: imageUrl || undefined, source: source || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSaving(false); return }
      setSaving(false)
      setEditing(false)
      router.refresh()
    } catch {
      setError('Connection error.')
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('Remove this question from the pool?')) return
    setDeleting(true)
    try {
      const res = await fetch('/api/diagnostic/admin/delete-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Something went wrong.'); setDeleting(false); return }
      if (data.softDeleted) {
        alert('This question already has recorded student answers, so it was deactivated instead of deleted — this keeps past results and PDFs accurate. It will no longer be drawn for new attempts.')
      }
      router.refresh()
    } catch {
      alert('Connection error.')
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-blue-300 p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <select value={topicId} onChange={e => setTopicId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={3}
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
              <input type="radio" name={`correctIndex-${question.id}`} checked={correctIndex === i} onChange={() => setCorrectIndex(i)} />
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
        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={cancelEdit} disabled={saving}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{topicTitle}</span>
          {!question.is_active && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">INACTIVE</span>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} title="Edit"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1">
            ✏️ Edit
          </button>
          <button onClick={remove} disabled={deleting} title="Delete"
            className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 disabled:opacity-50">
            {deleting ? '…' : '✕'}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-800 mb-2">{question.content}</p>
      <div className="space-y-1">
        {question.mcq_options.map((opt, i) => (
          <div key={i} className={`text-xs px-2 py-1 rounded ${i === question.mcq_correct_index ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-500'}`}>
            {String.fromCharCode(65 + i)}. {opt}{i === question.mcq_correct_index ? ' ✓' : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
