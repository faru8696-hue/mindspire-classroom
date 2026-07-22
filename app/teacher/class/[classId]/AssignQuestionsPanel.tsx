'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Unit { id: string; title: string; order_index: number }
interface Topic { id: string; title: string; unit_id: string; order_index: number }
interface Question { id: string; title: string; content: string | null; topic_id: string; order_index: number; source?: string | null }
interface Assignment { question_id: string; due_date: string | null }

// Teacher-only provenance grouping — where each question was sourced from
// (topic worksheet, episode review packet, MCQ practice set, savemyexams
// export, teacher-written key packet, or a one-off supplemental packet).
// Students never see this; it only affects how this panel groups/labels
// questions so a teacher can publish one set at a time instead of an
// entire topic in one shot.
const SOURCE_ORDER = ['Topic Worksheet', 'MCQ Practice', 'Episode Review', 'SaveMyExams', 'Teacher Key Packet', 'Supplemental Packet', 'Unsorted']
const SOURCE_STYLE: Record<string, string> = {
  'Topic Worksheet': 'bg-blue-100 text-blue-700',
  'MCQ Practice': 'bg-teal-100 text-teal-700',
  'Episode Review': 'bg-indigo-100 text-indigo-700',
  'SaveMyExams': 'bg-amber-100 text-amber-700',
  'Teacher Key Packet': 'bg-green-100 text-green-700',
  'Supplemental Packet': 'bg-pink-100 text-pink-700',
  'Unsorted': 'bg-gray-100 text-gray-600',
}

function groupBySource(qs: Question[]): [string, Question[]][] {
  const groups = new Map<string, Question[]>()
  for (const q of qs) {
    const key = q.source ?? 'Unsorted'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(q)
  }
  return SOURCE_ORDER
    .filter(key => groups.has(key))
    .map(key => [key, groups.get(key)!] as [string, Question[]])
}

interface Props {
  classId: string
  units: Unit[]
  topics: Topic[]
  questions: Question[]
  initialAssignments: Assignment[]
  submittedCounts: Record<string, number>
  totalStudents: number
}

export default function AssignQuestionsPanel({ classId, units, topics, questions, initialAssignments, submittedCounts, totalStudents }: Props) {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<Map<string, string | null>>(
    () => new Map(initialAssignments.map(a => [a.question_id, a.due_date]))
  )
  const [dueDateInputs, setDueDateInputs] = useState<Map<string, string>>(
    () => new Map(initialAssignments.filter(a => a.due_date).map(a => [a.question_id, a.due_date!]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [savingTopic, setSavingTopic] = useState<string | null>(null)
  // Keyed by `${topicId}::${source}` — tracks an in-flight "publish this set"
  // click for a single source group, separately from the whole-topic one above.
  const [savingGroup, setSavingGroup] = useState<string | null>(null)
  const [openUnit, setOpenUnit] = useState<string | null>(units[0]?.id ?? null)
  // Topics default collapsed — with some topics now holding 30-40 questions,
  // showing every question in every topic at once made the page an endless
  // scroll. Collapsed by default, one click expands just the topic you want.
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set())

  function toggleTopic(topicId: string) {
    setOpenTopics(prev => {
      const next = new Set(prev)
      next.has(topicId) ? next.delete(topicId) : next.add(topicId)
      return next
    })
  }

  async function toggle(questionId: string) {
    const isAssigned = assignments.has(questionId)
    setSaving(questionId)

    if (isAssigned) {
      const { error } = await supabase.from('assignments').delete().eq('question_id', questionId).eq('class_id', classId)
      if (!error) {
        setAssignments(prev => { const m = new Map(prev); m.delete(questionId); return m })
      }
    } else {
      const due = dueDateInputs.get(questionId) || null
      const q = questions.find(q => q.id === questionId)
      const { error } = await supabase.from('assignments').insert({ question_id: questionId, class_id: classId, due_date: due || null })
      if (!error) {
        setAssignments(prev => new Map(prev).set(questionId, due))
        fetch('/api/notify-assignment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classId, questionId, questionTitle: q?.title }),
        })
      }
    }
    setSaving(null)
  }

  // Assigns every not-yet-assigned question in a topic in one go, instead
  // of flipping each toggle individually — "make this topic live" for the
  // whole class at once. Already-assigned questions in the topic are left
  // alone (their due dates aren't touched).
  async function assignTopic(topicId: string) {
    const topicQs = questions.filter(q => q.topic_id === topicId && !assignments.has(q.id))
    if (topicQs.length === 0) return
    setSavingTopic(topicId)
    try {
      const { error } = await supabase.from('assignments').insert(
        topicQs.map(q => ({ question_id: q.id, class_id: classId, due_date: null }))
      )
      if (!error) {
        setAssignments(prev => {
          const m = new Map(prev)
          for (const q of topicQs) m.set(q.id, null)
          return m
        })
        for (const q of topicQs) {
          fetch('/api/notify-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId, questionId: q.id, questionTitle: q.title }),
          })
        }
      }
    } finally {
      setSavingTopic(null)
    }
  }

  // Same as assignTopic, but scoped to just one source group within a topic —
  // "publish the SaveMyExams set" without also making the Topic Worksheet or
  // Episode Review questions in the same topic live.
  async function assignSourceGroup(topicId: string, source: string, groupQs: Question[]) {
    const unassigned = groupQs.filter(q => !assignments.has(q.id))
    if (unassigned.length === 0) return
    const groupKey = `${topicId}::${source}`
    setSavingGroup(groupKey)
    try {
      const { error } = await supabase.from('assignments').insert(
        unassigned.map(q => ({ question_id: q.id, class_id: classId, due_date: null }))
      )
      if (!error) {
        setAssignments(prev => {
          const m = new Map(prev)
          for (const q of unassigned) m.set(q.id, null)
          return m
        })
        for (const q of unassigned) {
          fetch('/api/notify-assignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId, questionId: q.id, questionTitle: q.title }),
          })
        }
      }
    } finally {
      setSavingGroup(null)
    }
  }

  async function updateDueDate(questionId: string, date: string) {
    setDueDateInputs(prev => new Map(prev).set(questionId, date))
    if (!assignments.has(questionId)) return
    await supabase.from('assignments').update({ due_date: date || null }).eq('question_id', questionId).eq('class_id', classId)
    setAssignments(prev => new Map(prev).set(questionId, date || null))
  }

  const assignedCount = assignments.size
  const totalCount = questions.length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          <span className="font-semibold text-purple-700">{assignedCount}</span> of {totalCount} questions assigned
        </span>
        {assignedCount > 0 && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Students only see assigned questions</span>
        )}
      </div>

      {units.map(unit => {
        const unitTopics = topics.filter(t => t.unit_id === unit.id)
        const unitQIds = questions.filter(q => unitTopics.some(t => t.id === q.topic_id)).map(q => q.id)
        const unitAssigned = unitQIds.filter(id => assignments.has(id)).length
        const isOpen = openUnit === unit.id

        return (
          <div key={unit.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setOpenUnit(isOpen ? null : unit.id)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800">{unit.title}</span>
                <span className="text-xs text-gray-500">{unitAssigned}/{unitQIds.length} assigned</span>
              </div>
              <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">
                {unitTopics.map(topic => {
                  const topicQs = questions.filter(q => q.topic_id === topic.id)
                  if (topicQs.length === 0) return null
                  const topicUnassignedCount = topicQs.filter(q => !assignments.has(q.id)).length
                  const topicAssignedCount = topicQs.length - topicUnassignedCount
                  const isTopicOpen = openTopics.has(topic.id)
                  return (
                    <div key={topic.id}>
                      <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleTopic(topic.id)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <span className="text-gray-400 text-xs flex-shrink-0">{isTopicOpen ? '▼' : '▶'}</span>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{topic.title}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0">({topicAssignedCount}/{topicQs.length})</span>
                        </button>
                        {topicUnassignedCount > 0 && (
                          <button
                            onClick={() => assignTopic(topic.id)}
                            disabled={savingTopic === topic.id}
                            className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg flex-shrink-0 disabled:opacity-50"
                          >
                            {savingTopic === topic.id ? 'Assigning…' : `▶ Make all ${topicUnassignedCount} live`}
                          </button>
                        )}
                      </div>
                      {isTopicOpen && groupBySource(topicQs).map(([source, groupQs]) => {
                        const groupUnassignedCount = groupQs.filter(q => !assignments.has(q.id)).length
                        const groupAssignedCount = groupQs.length - groupUnassignedCount
                        const groupKey = `${topic.id}::${source}`

                        return (
                          <div key={source}>
                            {/* Source sub-header — teacher-only grouping so a set
                                (e.g. just the SaveMyExams questions) can be
                                published on its own instead of the whole topic. */}
                            <div className="pl-8 pr-5 py-1.5 bg-white border-b border-gray-50 flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${SOURCE_STYLE[source] ?? SOURCE_STYLE.Unsorted}`}>
                                {source}
                              </span>
                              <span className="text-[11px] text-gray-400 flex-1">{groupAssignedCount}/{groupQs.length} assigned</span>
                              {groupUnassignedCount > 0 && (
                                <button
                                  onClick={() => assignSourceGroup(topic.id, source, groupQs)}
                                  disabled={savingGroup === groupKey}
                                  className="text-[11px] font-semibold bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-0.5 rounded-lg flex-shrink-0 disabled:opacity-50"
                                >
                                  {savingGroup === groupKey ? 'Publishing…' : `Publish this set (${groupUnassignedCount})`}
                                </button>
                              )}
                            </div>

                            {groupQs.map(q => {
                              const isAssigned = assignments.has(q.id)
                              const isSaving = saving === q.id
                              const dueDate = dueDateInputs.get(q.id) ?? ''

                              return (
                                <div
                                  key={q.id}
                                  className={`flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0 ${isAssigned ? 'bg-purple-50/40' : ''}`}
                                >
                                  {/* Toggle */}
                                  <button
                                    onClick={() => toggle(q.id)}
                                    disabled={isSaving}
                                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${isAssigned ? 'bg-purple-600' : 'bg-gray-300'} ${isSaving ? 'opacity-50' : ''}`}
                                  >
                                    <span
                                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAssigned ? 'translate-x-5' : 'translate-x-0.5'}`}
                                    />
                                  </button>

                                  {/* Question info — always a link to the review page, so
                                      unassigned ("unlive") questions can be reviewed too,
                                      not just ones currently assigned to students. */}
                                  <Link href={`/teacher/questions/${q.id}`} className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate hover:text-purple-700 hover:underline ${isAssigned ? 'text-gray-800' : 'text-gray-500'}`}>{q.title}</p>
                                    {q.content && <p className="text-xs text-gray-400 truncate">{q.content}</p>}
                                  </Link>

                                  {/* Due date + submitted count + jump straight into
                                      watching every student's live board for this
                                      question — the flow the class page is built
                                      around now. */}
                                  {isAssigned && (
                                    <>
                                      <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                                        {submittedCounts[q.id] ?? 0}/{totalStudents} submitted
                                      </span>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <label className="text-xs text-gray-500">Due:</label>
                                        <input
                                          type="date"
                                          value={dueDate}
                                          onChange={e => updateDueDate(q.id, e.target.value)}
                                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-700"
                                        />
                                      </div>
                                      <Link
                                        href={`/teacher/live/${classId}/${q.id}`}
                                        className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex-shrink-0 whitespace-nowrap"
                                      >
                                        🔴 Go Live
                                      </Link>
                                    </>
                                  )}
                                  {!isAssigned && (
                                    <Link
                                      href={`/teacher/questions/${q.id}`}
                                      className="text-xs font-medium text-purple-600 hover:text-purple-800 flex-shrink-0 whitespace-nowrap"
                                    >
                                      Review →
                                    </Link>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {units.length === 0 && (
        <p className="text-gray-500 text-sm">No content yet. <a href="/teacher/content" className="text-purple-600 underline">Add units and questions →</a></p>
      )}
    </div>
  )
}
