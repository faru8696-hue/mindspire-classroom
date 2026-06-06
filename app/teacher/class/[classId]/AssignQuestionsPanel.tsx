'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Unit { id: string; title: string; order_index: number }
interface Topic { id: string; title: string; unit_id: string; order_index: number }
interface Question { id: string; title: string; content: string | null; topic_id: string; order_index: number }
interface Assignment { question_id: string; due_date: string | null }

interface Props {
  classId: string
  units: Unit[]
  topics: Topic[]
  questions: Question[]
  initialAssignments: Assignment[]
}

export default function AssignQuestionsPanel({ classId, units, topics, questions, initialAssignments }: Props) {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<Map<string, string | null>>(
    () => new Map(initialAssignments.map(a => [a.question_id, a.due_date]))
  )
  const [dueDateInputs, setDueDateInputs] = useState<Map<string, string>>(
    () => new Map(initialAssignments.filter(a => a.due_date).map(a => [a.question_id, a.due_date!]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [openUnit, setOpenUnit] = useState<string | null>(units[0]?.id ?? null)

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
                  return (
                    <div key={topic.id}>
                      <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{topic.title}</p>
                      </div>
                      {topicQs.map(q => {
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

                            {/* Question info */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isAssigned ? 'text-gray-800' : 'text-gray-500'}`}>{q.title}</p>
                              {q.content && <p className="text-xs text-gray-400 truncate">{q.content}</p>}
                            </div>

                            {/* Due date */}
                            {isAssigned && (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <label className="text-xs text-gray-500">Due:</label>
                                <input
                                  type="date"
                                  value={dueDate}
                                  onChange={e => updateDueDate(q.id, e.target.value)}
                                  className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-700"
                                />
                              </div>
                            )}
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
