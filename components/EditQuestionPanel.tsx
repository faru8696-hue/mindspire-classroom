'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface TopicOption { id: string; title: string; unitTitle: string }

export default function EditQuestionPanel({
  questionId, classId, title, content, topicId, source, difficulty, points, topics,
}: {
  questionId: string
  classId: string
  title: string
  content: string | null
  topicId: string
  source: string | null
  difficulty?: string | null
  points?: number | null
  topics: TopicOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftContent, setDraftContent] = useState(content ?? '')
  const [draftTopicId, setDraftTopicId] = useState(topicId)
  const [draftSource, setDraftSource] = useState(source ?? '')
  const [draftDifficulty, setDraftDifficulty] = useState(difficulty ?? '')
  const [draftPoints, setDraftPoints] = useState(points != null ? String(points) : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function save() {
    if (!draftTitle.trim()) { setError('Title is required.'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/questions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId, title: draftTitle.trim(), content: draftContent.trim() || undefined,
          topicId: draftTopicId, source: draftSource.trim() || undefined,
          difficulty: draftDifficulty || null,
          points: draftPoints.trim() ? Number(draftPoints) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSaving(false); return }
      setSaving(false)
      setOpen(false)
      // Every page this panel is used on is keyed by questionId (not
      // topicId), so a refresh alone re-fetches the question at its new
      // topic/location — no navigation needed even after a move.
      router.refresh()
    } catch {
      setError('Connection error.')
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this question? If students have already submitted work on it, it will be deactivated instead (kept for grading history) and hidden from students going forward.')) return
    setDeleting(true)
    try {
      const res = await fetch('/api/questions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Something went wrong.'); setDeleting(false); return }
      if (data.softDeleted) {
        alert('This question already has student submissions, so it was deactivated instead of deleted — past grades and work are preserved, and it will no longer be shown to students.')
      }
      router.push(`/teacher/class/${classId}`)
    } catch {
      alert('Connection error.')
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-gray-500 hover:text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors flex-shrink-0"
      >
        ✏️ Edit Question
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !saving && !deleting && setOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-5 space-y-3 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Edit Question</h3>
              <span className="text-xs text-gray-400">Changes apply everywhere this question appears</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content / details</label>
              <textarea value={draftContent} onChange={e => setDraftContent(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <select value={draftTopicId} onChange={e => setDraftTopicId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400">
                {topics.map(t => <option key={t.id} value={t.id}>{t.unitTitle} — {t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source / worksheet (optional)</label>
              <input value={draftSource} onChange={e => setDraftSource(e.target.value)} placeholder="e.g. MCQ Practice, Episode Review"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select value={draftDifficulty} onChange={e => setDraftDifficulty(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option value="">None</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input type="number" min={0} value={draftPoints} onChange={e => setDraftPoints(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-2">
                <button onClick={save} disabled={saving || deleting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setOpen(false)} disabled={saving || deleting}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
                  Cancel
                </button>
              </div>
              <button onClick={remove} disabled={saving || deleting}
                className="text-red-500 hover:text-red-700 text-sm font-semibold disabled:opacity-50">
                {deleting ? 'Removing…' : '🗑 Delete question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
