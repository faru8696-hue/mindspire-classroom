'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Topic { id: string; title: string }
interface Unit { id: string; title: string; topics: Topic[] }

export default function BuildTestForm({ classId, unitsWithTopics, hasDifficulty }: { classId: string; unitsWithTopics: Unit[]; hasDifficulty: boolean }) {
  const router = useRouter()
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [easy, setEasy] = useState(5)
  const [medium, setMedium] = useState(5)
  const [hard, setHard] = useState(3)
  const [totalCount, setTotalCount] = useState(10)
  const [questionType, setQuestionType] = useState<'any' | 'frq' | 'mcq'>('any')
  const [timed, setTimed] = useState(false)
  const [duration, setDuration] = useState(20)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleTopic(id: string) {
    setSelectedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleUnit(unit: Unit, checked: boolean) {
    setSelectedTopics(prev => {
      const next = new Set(prev)
      for (const t of unit.topics) { if (checked) next.add(t.id); else next.delete(t.id) }
      return next
    })
  }

  async function handleCreate() {
    setError(null)
    if (hasDifficulty && easy + medium + hard === 0) { setError('Pick at least one question.'); return }
    if (!hasDifficulty && totalCount <= 0) { setError('Pick at least one question.'); return }
    if (selectedTopics.size === 0) { setError('Select at least one topic.'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/practice/create-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          topicIds: [...selectedTopics],
          ...(hasDifficulty ? { counts: { easy, medium, hard } } : { totalCount }),
          questionType,
          durationMinutes: timed ? duration : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not build test')
      router.push(`/student/${classId}/practice/session/${data.testId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build test')
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Units & Subtopics</h2>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {unitsWithTopics.map(u => {
            const allSelected = u.topics.length > 0 && u.topics.every(t => selectedTopics.has(t.id))
            return (
              <div key={u.id}>
                <label className="flex items-center gap-2 font-medium text-sm text-gray-700">
                  <input type="checkbox" checked={allSelected} onChange={e => toggleUnit(u, e.target.checked)} />
                  {u.title}
                </label>
                <div className="ml-6 mt-1 space-y-1">
                  {u.topics.map(t => (
                    <label key={t.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" checked={selectedTopics.has(t.id)} onChange={() => toggleTopic(t.id)} />
                      {t.title}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
          {unitsWithTopics.length === 0 && <p className="text-sm text-gray-400">No topics in this class yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Question Type</h2>
        <div className="flex gap-2">
          {([
            { v: 'any', label: 'Both' },
            { v: 'frq', label: 'Free Response' },
            { v: 'mcq', label: 'Multiple Choice' },
          ] as const).map(opt => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setQuestionType(opt.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${questionType === opt.v ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Multiple choice is graded instantly by the app. Free response is self-checked against the answer key.</p>
      </div>

      {hasDifficulty ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-3">How many questions?</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Easy', value: easy, set: setEasy, cls: 'text-sky-700' },
              { label: 'Medium', value: medium, set: setMedium, cls: 'text-orange-700' },
              { label: 'Hard', value: hard, set: setHard, cls: 'text-rose-700' },
            ].map(d => (
              <div key={d.label}>
                <label className={`text-xs font-bold uppercase tracking-wide ${d.cls}`}>{d.label}</label>
                <input
                  type="number" min={0} max={50} value={d.value}
                  onChange={e => d.set(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Total: {easy + medium + hard} questions, {easy * 1 + medium * 2 + hard * 3} points</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-3">How many questions?</h2>
          <input
            type="number" min={1} max={100} value={totalCount}
            onChange={e => setTotalCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 0)))}
            className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <label className="flex items-center gap-2 font-semibold text-gray-700 text-sm mb-2">
          <input type="checkbox" checked={timed} onChange={e => setTimed(e.target.checked)} />
          Timed test
        </label>
        {timed && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number" min={1} max={180} value={duration}
              onChange={e => setDuration(Math.max(1, Math.min(180, parseInt(e.target.value) || 0)))}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-500">minutes</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
      >
        {creating ? 'Building test…' : 'Build Test'}
      </button>
    </div>
  )
}
