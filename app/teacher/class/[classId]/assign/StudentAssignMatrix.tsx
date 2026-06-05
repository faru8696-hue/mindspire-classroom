'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Student { id: string; full_name: string; nickname: string | null; avatar_url: string | null }
interface Unit { id: string; title: string; order_index: number }
interface Topic { id: string; title: string; unit_id: string; order_index: number }
interface Question { id: string; title: string; topic_id: string; order_index: number }
interface Assignment { student_id: string; question_id: string; due_date: string | null }

interface Props {
  classId: string
  students: Student[]
  units: Unit[]
  topics: Topic[]
  questions: Question[]
  initialAssignments: Assignment[]
}

type AssignKey = `${string}:${string}` // studentId:questionId

export default function StudentAssignMatrix({ classId, students, units, topics, questions, initialAssignments }: Props) {
  const supabase = createClient()

  // assigned[studentId:questionId] = true
  const [assigned, setAssigned] = useState<Set<AssignKey>>(
    () => new Set(initialAssignments.map(a => `${a.student_id}:${a.question_id}` as AssignKey))
  )
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Selected questions and students for bulk actions
  const [selQuestions, setSelQuestions] = useState<Set<string>>(new Set())
  const [selStudents, setSelStudents] = useState<Set<string>>(new Set())

  const key = (sid: string, qid: string): AssignKey => `${sid}:${qid}`

  // Toggle a single cell
  async function toggleCell(studentId: string, questionId: string) {
    const k = key(studentId, questionId)
    const isOn = assigned.has(k)
    setAssigned(prev => {
      const next = new Set(prev)
      isOn ? next.delete(k) : next.add(k)
      return next
    })
    if (isOn) {
      await supabase.from('student_assignments').delete()
        .eq('student_id', studentId).eq('question_id', questionId)
    } else {
      await supabase.from('student_assignments').upsert(
        { student_id: studentId, question_id: questionId },
        { onConflict: 'student_id,question_id' }
      )
    }
  }

  // Assign all questions to one student
  async function assignAllToStudent(studentId: string) {
    const qids = questions.map(q => q.id)
    setAssigned(prev => {
      const next = new Set(prev)
      qids.forEach(qid => next.add(key(studentId, qid)))
      return next
    })
    await supabase.from('student_assignments').upsert(
      qids.map(qid => ({ student_id: studentId, question_id: qid })),
      { onConflict: 'student_id,question_id' }
    )
  }

  // Assign one question to all students
  async function assignQuestionToAll(questionId: string) {
    const sids = students.map(s => s.id)
    setAssigned(prev => {
      const next = new Set(prev)
      sids.forEach(sid => next.add(key(sid, questionId)))
      return next
    })
    await supabase.from('student_assignments').upsert(
      sids.map(sid => ({ student_id: sid, question_id: questionId })),
      { onConflict: 'student_id,question_id' }
    )
  }

  // Assign entire topic to all students
  async function assignTopicToAll(topicId: string) {
    const qids = questions.filter(q => q.topic_id === topicId).map(q => q.id)
    const sids = students.map(s => s.id)
    setAssigned(prev => {
      const next = new Set(prev)
      sids.forEach(sid => qids.forEach(qid => next.add(key(sid, qid))))
      return next
    })
    await supabase.from('student_assignments').upsert(
      sids.flatMap(sid => qids.map(qid => ({ student_id: sid, question_id: qid }))),
      { onConflict: 'student_id,question_id' }
    )
  }

  // Bulk: assign selected questions to selected students
  async function bulkAssign() {
    if (selQuestions.size === 0 || selStudents.size === 0) return
    setSaving(true)
    const pairs = [...selStudents].flatMap(sid => [...selQuestions].map(qid => ({ student_id: sid, question_id: qid })))
    setAssigned(prev => {
      const next = new Set(prev)
      pairs.forEach(p => next.add(key(p.student_id, p.question_id)))
      return next
    })
    await supabase.from('student_assignments').upsert(pairs, { onConflict: 'student_id,question_id' })
    setSaving(false)
    setSavedMsg(`Assigned ${selQuestions.size} question(s) to ${selStudents.size} student(s)`)
    setTimeout(() => setSavedMsg(''), 3000)
    setSelQuestions(new Set()); setSelStudents(new Set())
  }

  // Bulk: remove selected questions from selected students
  async function bulkRemove() {
    if (selQuestions.size === 0 || selStudents.size === 0) return
    setSaving(true)
    setAssigned(prev => {
      const next = new Set(prev)
      ;[...selStudents].forEach(sid => [...selQuestions].forEach(qid => next.delete(key(sid, qid))))
      return next
    })
    for (const sid of selStudents) {
      await supabase.from('student_assignments').delete()
        .eq('student_id', sid).in('question_id', [...selQuestions])
    }
    setSaving(false)
    setSavedMsg(`Removed ${selQuestions.size} question(s) from ${selStudents.size} student(s)`)
    setTimeout(() => setSavedMsg(''), 3000)
    setSelQuestions(new Set()); setSelStudents(new Set())
  }

  const allQIds = questions.map(q => q.id)
  const allSIds = students.map(s => s.id)
  const allQSelected = selQuestions.size === allQIds.length
  const allSSelected = selStudents.size === allSIds.length

  return (
    <div className="space-y-4">
      {/* Bulk action bar */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-purple-800">Bulk assign:</span>
          <span className="text-purple-700">
            {selQuestions.size} question{selQuestions.size !== 1 ? 's' : ''} &amp; {selStudents.size} student{selStudents.size !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setSelQuestions(new Set(allQIds)); setSelStudents(new Set(allSIds)) }}
            className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500">
            Select All
          </button>
          <button onClick={() => { setSelQuestions(new Set()); setSelStudents(new Set()) }}
            className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Clear
          </button>
          <button onClick={bulkAssign} disabled={saving || selQuestions.size === 0 || selStudents.size === 0}
            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-40 font-semibold">
            ✓ Assign Selected
          </button>
          <button onClick={bulkRemove} disabled={saving || selQuestions.size === 0 || selStudents.size === 0}
            className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-400 disabled:opacity-40">
            ✗ Remove Selected
          </button>
        </div>
        {savedMsg && <span className="text-xs text-green-700 font-semibold ml-auto">{savedMsg}</span>}
      </div>

      {/* Matrix table — horizontally scrollable */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="border-collapse min-w-full">
          <thead>
            <tr className="bg-gray-50">
              {/* Question column header */}
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-r border-gray-200 min-w-[220px]">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={allQSelected} onChange={e => setSelQuestions(e.target.checked ? new Set(allQIds) : new Set())}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span>Question</span>
                </div>
              </th>
              {/* Student columns */}
              {students.map(s => (
                <th key={s.id} className="px-2 py-2 text-center border-b border-r border-gray-200 min-w-[80px] max-w-[100px]">
                  <div className="flex flex-col items-center gap-1">
                    <input type="checkbox" checked={selStudents.has(s.id)}
                      onChange={e => setSelStudents(prev => { const n = new Set(prev); e.target.checked ? n.add(s.id) : n.delete(s.id); return n })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    {s.avatar_url
                      ? <img src={s.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      : <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                          {(s.nickname || s.full_name).charAt(0).toUpperCase()}
                        </div>
                    }
                    <span className="text-xs text-gray-700 font-medium leading-tight text-center truncate w-full px-1" title={s.full_name}>
                      {s.nickname || s.full_name.split(' ')[0]}
                    </span>
                    <button onClick={() => assignAllToStudent(s.id)}
                      className="text-xs text-purple-500 hover:text-purple-700 leading-none" title="Assign all questions to this student">
                      all↓
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-xs text-gray-400 border-b border-gray-200 whitespace-nowrap">Assign Row</th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => {
              const unitTopics = topics.filter(t => t.unit_id === unit.id)
              const unitQs = questions.filter(q => unitTopics.some(t => t.id === q.topic_id))
              if (unitQs.length === 0) return null
              return [
                // Unit header row
                <tr key={`unit-${unit.id}`} className="bg-purple-50">
                  <td colSpan={students.length + 2} className="sticky left-0 px-4 py-2 text-xs font-bold text-purple-800 uppercase tracking-wide border-b border-gray-200">
                    {unit.title}
                  </td>
                </tr>,
                // Topics + questions
                ...unitTopics.flatMap(topic => {
                  const topicQs = questions.filter(q => q.topic_id === topic.id)
                  if (topicQs.length === 0) return []
                  return [
                    // Topic header
                    <tr key={`topic-${topic.id}`} className="bg-gray-50/70">
                      <td className="sticky left-0 z-10 bg-gray-50/70 px-4 py-1.5 border-b border-gray-100 border-r" colSpan={1}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{topic.title}</span>
                          <button onClick={() => assignTopicToAll(topic.id)}
                            className="text-xs text-purple-500 hover:text-purple-700 whitespace-nowrap" title="Assign all questions in this topic to all students">
                            Assign topic to all →
                          </button>
                        </div>
                      </td>
                      {students.map(s => <td key={s.id} className="border-b border-r border-gray-100" />)}
                      <td className="border-b border-gray-100" />
                    </tr>,
                    // Question rows
                    ...topicQs.map(q => {
                      const qAssignedCount = students.filter(s => assigned.has(key(s.id, q.id))).length
                      return (
                        <tr key={q.id} className={`hover:bg-gray-50 transition-colors ${selQuestions.has(q.id) ? 'bg-purple-50/60' : ''}`}>
                          {/* Question name + checkbox */}
                          <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-b border-r border-gray-100 min-w-[220px]">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={selQuestions.has(q.id)}
                                onChange={e => setSelQuestions(prev => { const n = new Set(prev); e.target.checked ? n.add(q.id) : n.delete(q.id); return n })}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0" />
                              <span className="text-sm text-gray-800 leading-tight">{q.title}</span>
                              {qAssignedCount > 0 && (
                                <span className="text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full flex-shrink-0">{qAssignedCount}</span>
                              )}
                            </div>
                          </td>
                          {/* Student cells */}
                          {students.map(s => {
                            const on = assigned.has(key(s.id, q.id))
                            return (
                              <td key={s.id} className="text-center px-2 py-2.5 border-b border-r border-gray-100">
                                <button
                                  onClick={() => toggleCell(s.id, q.id)}
                                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mx-auto transition-all ${
                                    on ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 hover:border-purple-400'
                                  }`}
                                  title={on ? `Remove from ${s.full_name}` : `Assign to ${s.full_name}`}
                                >
                                  {on && <span className="text-xs font-bold">✓</span>}
                                </button>
                              </td>
                            )
                          })}
                          {/* Assign to all */}
                          <td className="px-3 py-2.5 border-b border-gray-100">
                            <button onClick={() => assignQuestionToAll(q.id)}
                              className="text-xs text-purple-500 hover:text-purple-700 whitespace-nowrap">
                              All →
                            </button>
                          </td>
                        </tr>
                      )
                    }),
                  ]
                }),
              ]
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Students will see questions assigned here in addition to any class-wide assignments. Changes save instantly.
      </p>
    </div>
  )
}
