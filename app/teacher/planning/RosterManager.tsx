'use client'

import { useState } from 'react'

export interface RosterTopicEntry {
  topicId: string
  topicTitle: string
  testDate: string | null
}

export interface RosterStudent {
  id: string
  name: string
  inGroup: boolean
  topics: RosterTopicEntry[]
  notStarted: boolean
  startsOn: string | null
  otherTopics: string | null
}

export interface ClassTopicOption {
  id: string
  title: string
}

interface AddTopicDraft { topicId: string; testDate: string }

export default function RosterManager({ classId, students, classTopics }: { classId: string; students: RosterStudent[]; classTopics: ClassTopicOption[] }) {
  const [open, setOpen] = useState(false)
  const [roster, setRoster] = useState(students)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [addTopicDraft, setAddTopicDraft] = useState<Map<string, AddTopicDraft>>(new Map())
  const [addStartsOnDraft, setAddStartsOnDraft] = useState<Map<string, string>>(new Map())
  const [addOtherDraft, setAddOtherDraft] = useState<Map<string, string>>(new Map())

  const excludedCount = roster.filter(s => !s.inGroup).length

  async function toggleGroup(studentId: string) {
    const current = roster.find(s => s.id === studentId)
    if (!current) return
    const nextInGroup = !current.inGroup
    setSavingId(studentId)
    const res = await fetch('/api/set-group-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, classId, inGroup: nextInGroup }),
    })
    setSavingId(null)
    if (res.ok) {
      setRoster(prev => prev.map(s => s.id === studentId ? { ...s, inGroup: nextInGroup } : s))
    }
  }

  async function deleteTopic(studentId: string, topicId: string) {
    const key = `${studentId}:topic:${topicId}`
    setBusyKey(key)
    const res = await fetch('/api/teacher-delete-response', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'topic', studentId, topicId }),
    })
    setBusyKey(null)
    if (res.ok) {
      setRoster(prev => prev.map(s => s.id === studentId ? { ...s, topics: s.topics.filter(t => t.topicId !== topicId) } : s))
    }
  }

  async function deleteNotStarted(studentId: string) {
    const key = `${studentId}:not_started`
    setBusyKey(key)
    const res = await fetch('/api/teacher-delete-response', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'not_started', studentId, classId }),
    })
    setBusyKey(null)
    if (res.ok) {
      setRoster(prev => prev.map(s => s.id === studentId ? { ...s, notStarted: false, startsOn: null } : s))
    }
  }

  async function deleteOtherTopics(studentId: string) {
    const key = `${studentId}:other_topics`
    setBusyKey(key)
    const res = await fetch('/api/teacher-delete-response', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'other_topics', studentId, classId }),
    })
    setBusyKey(null)
    if (res.ok) {
      setRoster(prev => prev.map(s => s.id === studentId ? { ...s, otherTopics: null } : s))
    }
  }

  async function addTopic(studentId: string) {
    const draft = addTopicDraft.get(studentId)
    if (!draft?.topicId) return
    const key = `${studentId}:add-topic`
    setBusyKey(key)
    const res = await fetch('/api/teacher-set-response', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'topic', studentId, classId, topicId: draft.topicId, testDate: draft.testDate || null }),
    })
    setBusyKey(null)
    if (res.ok) {
      const topicTitle = classTopics.find(t => t.id === draft.topicId)?.title ?? ''
      setRoster(prev => prev.map(s => s.id === studentId
        ? { ...s, topics: [...s.topics.filter(t => t.topicId !== draft.topicId), { topicId: draft.topicId, topicTitle, testDate: draft.testDate || null }] }
        : s))
      setAddTopicDraft(prev => { const m = new Map(prev); m.delete(studentId); return m })
    }
  }

  async function addNotStarted(studentId: string) {
    const startsOn = addStartsOnDraft.get(studentId) || null
    const key = `${studentId}:add-not-started`
    setBusyKey(key)
    const res = await fetch('/api/teacher-set-response', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'not_started', studentId, classId, startsOn }),
    })
    setBusyKey(null)
    if (res.ok) {
      setRoster(prev => prev.map(s => s.id === studentId ? { ...s, notStarted: true, startsOn } : s))
      setAddStartsOnDraft(prev => { const m = new Map(prev); m.delete(studentId); return m })
    }
  }

  async function addOtherTopics(studentId: string) {
    const text = (addOtherDraft.get(studentId) ?? '').trim()
    if (!text) return
    const key = `${studentId}:add-other`
    setBusyKey(key)
    const res = await fetch('/api/teacher-set-response', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'other_topics', studentId, classId, text }),
    })
    setBusyKey(null)
    if (res.ok) {
      setRoster(prev => prev.map(s => s.id === studentId ? { ...s, otherTopics: text } : s))
      setAddOtherDraft(prev => { const m = new Map(prev); m.delete(studentId); return m })
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">
          👥 Manage roster
          {excludedCount > 0 && <span className="text-xs font-normal text-gray-400 ml-2">({excludedCount} excluded from planning)</span>}
        </span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {roster.map(s => {
            const isExpanded = expandedId === s.id
            const hasResponse = s.topics.length > 0 || s.notStarted || !!s.otherTopics
            const availableTopics = classTopics.filter(t => !s.topics.some(st => st.topicId === t.id))
            const draft = addTopicDraft.get(s.id) ?? { topicId: '', testDate: '' }

            return (
              <div key={s.id}>
                <div className="flex items-center justify-between px-4 py-2 text-sm">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <span className="text-gray-400 text-xs flex-shrink-0">{isExpanded ? '▼' : '▶'}</span>
                    <span className={s.inGroup ? 'text-gray-700' : 'text-gray-400'}>{s.name}</span>
                    {!hasResponse && <span className="text-xs text-gray-300 flex-shrink-0">No response yet</span>}
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                    <span className="text-xs text-gray-500">Group student</span>
                    <button
                      type="button"
                      onClick={() => toggleGroup(s.id)}
                      disabled={savingId === s.id}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${s.inGroup ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.inGroup ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3 pl-9 space-y-1.5">
                    {s.topics.map(t => (
                      <div key={t.topicId} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <span className="text-gray-700 truncate">{t.topicTitle}{t.testDate ? ` — test ${t.testDate}` : ''}</span>
                        <button
                          onClick={() => deleteTopic(s.id, t.topicId)}
                          disabled={busyKey === `${s.id}:topic:${t.topicId}`}
                          className="text-gray-400 hover:text-red-500 flex-shrink-0 disabled:opacity-50"
                          title="Delete this response"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Add a topic on this student's behalf */}
                    {availableTopics.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <select
                          value={draft.topicId}
                          onChange={e => setAddTopicDraft(prev => new Map(prev).set(s.id, { ...draft, topicId: e.target.value }))}
                          className="text-xs border border-gray-200 rounded px-1.5 py-1 flex-1 min-w-0 text-gray-700"
                        >
                          <option value="">+ Add a topic…</option>
                          {availableTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                        <input
                          type="date"
                          value={draft.testDate}
                          onChange={e => setAddTopicDraft(prev => new Map(prev).set(s.id, { ...draft, testDate: e.target.value }))}
                          className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-700 flex-shrink-0"
                        />
                        <button
                          onClick={() => addTopic(s.id)}
                          disabled={!draft.topicId || busyKey === `${s.id}:add-topic`}
                          className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded disabled:opacity-40 flex-shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    {s.notStarted ? (
                      <div className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <span className="text-gray-700">Hasn&apos;t started{s.startsOn ? ` — expected ${s.startsOn}` : ''}</span>
                        <button
                          onClick={() => deleteNotStarted(s.id)}
                          disabled={busyKey === `${s.id}:not_started`}
                          className="text-gray-400 hover:text-red-500 flex-shrink-0 disabled:opacity-50"
                          title="Delete this response"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <input
                          type="date"
                          value={addStartsOnDraft.get(s.id) ?? ''}
                          onChange={e => setAddStartsOnDraft(prev => new Map(prev).set(s.id, e.target.value))}
                          placeholder="Expected start"
                          className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-700 flex-shrink-0"
                        />
                        <button
                          onClick={() => addNotStarted(s.id)}
                          disabled={busyKey === `${s.id}:add-not-started`}
                          className="text-xs font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded disabled:opacity-40"
                        >
                          + Mark hasn&apos;t started
                        </button>
                      </div>
                    )}

                    {s.otherTopics ? (
                      <div className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <span className="text-gray-700 truncate">&quot;{s.otherTopics}&quot;</span>
                        <button
                          onClick={() => deleteOtherTopics(s.id)}
                          disabled={busyKey === `${s.id}:other_topics`}
                          className="text-gray-400 hover:text-red-500 flex-shrink-0 disabled:opacity-50"
                          title="Delete this response"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <input
                          type="text"
                          value={addOtherDraft.get(s.id) ?? ''}
                          onChange={e => setAddOtherDraft(prev => new Map(prev).set(s.id, e.target.value))}
                          placeholder="Add an other-topics note…"
                          className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-700 flex-1 min-w-0"
                        />
                        <button
                          onClick={() => addOtherTopics(s.id)}
                          disabled={!(addOtherDraft.get(s.id) ?? '').trim() || busyKey === `${s.id}:add-other`}
                          className="text-xs font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded disabled:opacity-40 flex-shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {roster.length === 0 && <p className="text-sm text-gray-400 px-4 py-3">No students enrolled.</p>}
        </div>
      )}
    </div>
  )
}
