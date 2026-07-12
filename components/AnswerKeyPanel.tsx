'use client'

import { useState } from 'react'

// Shows a question's AI-drafted answer key so a teacher can compare it
// against student work while grading, without doing the calculation
// themselves. Always editable — the AI draft is a starting point, not
// ground truth, and the teacher has the final word if it's wrong.
export default function AnswerKeyPanel({
  questionId, initialAnswerKey, dark = false,
}: { questionId: string; initialAnswerKey: string | null; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const [answerKey, setAnswerKey] = useState(initialAnswerKey)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialAnswerKey ?? '')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-answer-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate answer key')
      setAnswerKey(data.answerKey)
      setDraft(data.answerKey)
      setOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate answer key')
    } finally {
      setGenerating(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/save-answer-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answerKey: draft }),
      })
      setAnswerKey(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const boxCls = dark
    ? 'bg-gray-800 border-gray-700 text-gray-200'
    : 'bg-emerald-50 border-emerald-200 text-gray-800'
  const headCls = dark ? 'text-gray-300' : 'text-emerald-800'

  return (
    <div className={`rounded-lg border ${boxCls} overflow-hidden flex-shrink-0`}>
      <button
        onClick={() => (answerKey ? setOpen(o => !o) : generate())}
        disabled={generating}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold ${headCls} disabled:opacity-50`}
      >
        <span>📖 Answer Key{!answerKey && !generating ? ' — click to generate' : ''}</span>
        <span>{generating ? 'Generating…' : answerKey ? (open ? '▲' : '▼') : ''}</span>
      </button>
      {error && <p className="px-3 pb-2 text-xs text-red-500">{error}</p>}
      {open && answerKey && (
        <div className="px-3 pb-3 max-h-72 overflow-y-auto">
          {editing ? (
            <>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={8}
                className={`w-full text-xs rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-emerald-400 ${dark ? 'bg-gray-900 border-gray-600 text-gray-200' : 'bg-white border-emerald-200'}`}
              />
              <div className="flex gap-2 mt-1.5">
                <button onClick={save} disabled={saving} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setDraft(answerKey ?? ''); setEditing(false) }} className="text-xs px-2.5 py-1 rounded-lg text-gray-400 hover:text-gray-600">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs whitespace-pre-wrap leading-relaxed">{answerKey}</p>
              <div className="flex gap-2 mt-1.5 sticky bottom-0 bg-inherit pt-1">
                <button onClick={() => setEditing(true)} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                  ✏️ Edit
                </button>
                <button onClick={generate} disabled={generating} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                  🔄 Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
