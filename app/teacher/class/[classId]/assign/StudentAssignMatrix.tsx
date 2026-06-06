'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Student { id: string; full_name: string; nickname: string | null; avatar_url: string | null }
interface Unit { id: string; title: string; order_index: number }
interface Topic { id: string; title: string; unit_id: string; order_index: number }
interface Question { id: string; title: string; topic_id: string; order_index: number }
interface Assignment { student_id: string; question_id: string; due_date: string | null }

type AssignKey = `${string}:${string}`

interface Props {
  classId: string
  students: Student[]
  units: Unit[]
  topics: Topic[]
  questions: Question[]
  initialAssignments: Assignment[]
}

export default function StudentAssignMatrix({ students, units, topics, questions, initialAssignments }: Props) {
  const supabase = createClient()

  const [assigned, setAssigned] = useState<Set<AssignKey>>(
    () => new Set(initialAssignments.map(a => `${a.student_id}:${a.question_id}` as AssignKey))
  )
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [selQuestions, setSelQuestions] = useState<Set<string>>(new Set())
  const [selStudents, setSelStudents] = useState<Set<string>>(new Set())

  const key = (sid: string, qid: string): AssignKey => `${sid}:${qid}`
  const allQIds = questions.map(q => q.id)
  const allSIds = students.map(s => s.id)

  function qidsForUnit(unitId: string) {
    const tids = new Set(topics.filter(t => t.unit_id === unitId).map(t => t.id))
    return questions.filter(q => tids.has(q.topic_id)).map(q => q.id)
  }
  function qidsForTopic(topicId: string) {
    return questions.filter(q => q.topic_id === topicId).map(q => q.id)
  }

  function notifyAssignment(studentIds: string[], qids: string[]) {
    qids.forEach(qid => {
      const q = questions.find(q => q.id === qid)
      fetch('/api/notify-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds, questionId: qid, questionTitle: q?.title }),
      })
    })
  }

  // Toggle a single cell
  async function toggleCell(sid: string, qid: string) {
    const k = key(sid, qid)
    const isOn = assigned.has(k)
    setAssigned(prev => { const n = new Set(prev); isOn ? n.delete(k) : n.add(k); return n })
    if (isOn) {
      await supabase.from('student_assignments').delete().eq('student_id', sid).eq('question_id', qid)
    } else {
      await supabase.from('student_assignments').upsert({ student_id: sid, question_id: qid }, { onConflict: 'student_id,question_id' })
      notifyAssignment([sid], [qid])
    }
  }

  // Assign a set of qids to a set of sids
  async function assignMany(sids: string[], qids: string[]) {
    if (!sids.length || !qids.length) return
    setSaving(true)
    setAssigned(prev => { const n = new Set(prev); sids.forEach(s => qids.forEach(q => n.add(key(s, q)))); return n })
    await supabase.from('student_assignments').upsert(
      sids.flatMap(s => qids.map(q => ({ student_id: s, question_id: q }))),
      { onConflict: 'student_id,question_id' }
    )
    notifyAssignment(sids, qids)
    setSaving(false)
  }

  // Remove a set of qids from a set of sids
  async function removeMany(sids: string[], qids: string[]) {
    if (!sids.length || !qids.length) return
    setSaving(true)
    setAssigned(prev => { const n = new Set(prev); sids.forEach(s => qids.forEach(q => n.delete(key(s, q)))); return n })
    for (const sid of sids) {
      await supabase.from('student_assignments').delete().eq('student_id', sid).in('question_id', qids)
    }
    setSaving(false)
  }

  async function bulkAssign() {
    await assignMany([...selStudents], [...selQuestions])
    setSavedMsg(`Assigned ${selQuestions.size} question(s) to ${selStudents.size} student(s)`)
    setTimeout(() => setSavedMsg(''), 3000)
    setSelQuestions(new Set()); setSelStudents(new Set())
  }

  async function bulkRemove() {
    await removeMany([...selStudents], [...selQuestions])
    setSavedMsg(`Removed ${selQuestions.size} question(s) from ${selStudents.size} student(s)`)
    setTimeout(() => setSavedMsg(''), 3000)
    setSelQuestions(new Set()); setSelStudents(new Set())
  }

  // Unit/topic checkbox helpers
  function unitCheckState(unitId: string): 'all' | 'some' | 'none' {
    const qids = qidsForUnit(unitId)
    const sel = qids.filter(q => selQuestions.has(q)).length
    return sel === qids.length ? 'all' : sel > 0 ? 'some' : 'none'
  }
  function topicCheckState(topicId: string): 'all' | 'some' | 'none' {
    const qids = qidsForTopic(topicId)
    const sel = qids.filter(q => selQuestions.has(q)).length
    return sel === qids.length ? 'all' : sel > 0 ? 'some' : 'none'
  }
  function toggleUnitQs(unitId: string) {
    const qids = qidsForUnit(unitId)
    const state = unitCheckState(unitId)
    setSelQuestions(prev => { const n = new Set(prev); state === 'all' ? qids.forEach(q => n.delete(q)) : qids.forEach(q => n.add(q)); return n })
  }
  function toggleTopicQs(topicId: string) {
    const qids = qidsForTopic(topicId)
    const state = topicCheckState(topicId)
    setSelQuestions(prev => { const n = new Set(prev); state === 'all' ? qids.forEach(q => n.delete(q)) : qids.forEach(q => n.add(q)); return n })
  }

  // Per-student unit/topic assignment state
  function studentUnitState(sid: string, unitId: string): 'all' | 'some' | 'none' {
    const qids = qidsForUnit(unitId)
    const on = qids.filter(q => assigned.has(key(sid, q))).length
    return on === qids.length ? 'all' : on > 0 ? 'some' : 'none'
  }
  function studentTopicState(sid: string, topicId: string): 'all' | 'some' | 'none' {
    const qids = qidsForTopic(topicId)
    const on = qids.filter(q => assigned.has(key(sid, q))).length
    return on === qids.length ? 'all' : on > 0 ? 'some' : 'none'
  }
  async function toggleStudentUnit(sid: string, unitId: string) {
    const qids = qidsForUnit(unitId)
    const state = studentUnitState(sid, unitId)
    state === 'all' ? await removeMany([sid], qids) : await assignMany([sid], qids)
  }
  async function toggleStudentTopic(sid: string, topicId: string) {
    const qids = qidsForTopic(topicId)
    const state = studentTopicState(sid, topicId)
    state === 'all' ? await removeMany([sid], qids) : await assignMany([sid], qids)
  }

  return (
    <div className="space-y-4">
      {/* How-to hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        <strong>How to assign:</strong> Check boxes in the left column to select questions/topics/units. Check student names at the top to select students. Then click <strong>Assign Selected</strong>. Or click the ✓/○ buttons directly in the grid to toggle one cell at a time.
      </div>

      {/* Bulk action bar */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-purple-800">
          {selQuestions.size} question{selQuestions.size !== 1 ? 's' : ''} &amp; {selStudents.size} student{selStudents.size !== 1 ? 's' : ''} selected
        </span>
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

      {/* Matrix */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="border-collapse min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-r border-gray-200 min-w-[240px]">
                <div className="flex items-center gap-2">
                  <input type="checkbox"
                    checked={selQuestions.size === allQIds.length && allQIds.length > 0}
                    ref={el => { if (el) el.indeterminate = selQuestions.size > 0 && selQuestions.size < allQIds.length }}
                    onChange={e => setSelQuestions(e.target.checked ? new Set(allQIds) : new Set())}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <span>Unit / Topic / Question</span>
                </div>
              </th>
              {students.map(s => (
                <th key={s.id} className="px-2 py-2 text-center border-b border-r border-gray-200 min-w-[80px]">
                  <div className="flex flex-col items-center gap-1">
                    <input type="checkbox" checked={selStudents.has(s.id)}
                      onChange={e => setSelStudents(prev => { const n = new Set(prev); e.target.checked ? n.add(s.id) : n.delete(s.id); return n })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    {s.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={s.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      : <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                          {(s.nickname || s.full_name).charAt(0).toUpperCase()}
                        </div>
                    }
                    <span className="text-xs text-gray-700 font-medium truncate w-full text-center px-1" title={s.full_name}>
                      {s.nickname || s.full_name.split(' ')[0]}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {units.map(unit => {
              const unitTopics = topics.filter(t => t.unit_id === unit.id)
              const unitQs = questions.filter(q => unitTopics.some(t => t.id === q.topic_id))
              if (unitQs.length === 0) return null
              const uState = unitCheckState(unit.id)
              return [
                /* ── Unit row ── */
                <tr key={`unit-${unit.id}`} className="bg-purple-50 border-b border-purple-200">
                  <td className="sticky left-0 z-10 bg-purple-50 px-4 py-2 border-r border-purple-200">
                    <div className="flex items-center gap-2">
                      <input type="checkbox"
                        checked={uState === 'all'}
                        ref={el => { if (el) el.indeterminate = uState === 'some' }}
                        onChange={() => toggleUnitQs(unit.id)}
                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm font-bold text-purple-900">📚 {unit.title}</span>
                      <span className="text-xs text-purple-500">({unitQs.length} questions)</span>
                    </div>
                  </td>
                  {students.map(s => {
                    const st = studentUnitState(s.id, unit.id)
                    return (
                      <td key={s.id} className="text-center px-2 py-2 border-r border-purple-100">
                        <button onClick={() => toggleStudentUnit(s.id, unit.id)}
                          className={`text-xs px-2 py-1 rounded-lg font-semibold transition-all ${
                            st === 'all' ? 'bg-purple-600 text-white' :
                            st === 'some' ? 'bg-purple-200 text-purple-700' :
                            'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
                          }`}
                          title={st === 'all' ? 'Remove whole unit' : 'Assign whole unit'}>
                          {st === 'all' ? '✓ All' : st === 'some' ? '~ Some' : '+ Unit'}
                        </button>
                      </td>
                    )
                  })}
                </tr>,

                /* ── Topics + questions ── */
                ...unitTopics.flatMap(topic => {
                  const topicQs = questions.filter(q => q.topic_id === topic.id)
                  if (topicQs.length === 0) return []
                  const tState = topicCheckState(topic.id)
                  return [
                    /* Topic row */
                    <tr key={`topic-${topic.id}`} className="bg-gray-50 border-b border-gray-200">
                      <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2 border-r border-gray-200 pl-8">
                        <div className="flex items-center gap-2">
                          <input type="checkbox"
                            checked={tState === 'all'}
                            ref={el => { if (el) el.indeterminate = tState === 'some' }}
                            onChange={() => toggleTopicQs(topic.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">📖 {topic.title}</span>
                          <span className="text-xs text-gray-400">({topicQs.length})</span>
                        </div>
                      </td>
                      {students.map(s => {
                        const st = studentTopicState(s.id, topic.id)
                        return (
                          <td key={s.id} className="text-center px-2 py-1.5 border-r border-gray-100">
                            <button onClick={() => toggleStudentTopic(s.id, topic.id)}
                              className={`text-xs px-2 py-0.5 rounded font-medium transition-all ${
                                st === 'all' ? 'bg-blue-500 text-white' :
                                st === 'some' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500'
                              }`}
                              title={st === 'all' ? 'Remove whole topic' : 'Assign whole topic'}>
                              {st === 'all' ? '✓' : st === 'some' ? '~' : '+'}
                            </button>
                          </td>
                        )
                      })}
                    </tr>,

                    /* Question rows */
                    ...topicQs.map(q => {
                      const assignedCount = students.filter(s => assigned.has(key(s.id, q.id))).length
                      return (
                        <tr key={q.id} className={`hover:bg-gray-50 border-b border-gray-50 ${selQuestions.has(q.id) ? 'bg-purple-50/50' : ''}`}>
                          <td className="sticky left-0 z-10 bg-white px-4 py-2 border-r border-gray-100 pl-12">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" checked={selQuestions.has(q.id)}
                                onChange={e => setSelQuestions(prev => { const n = new Set(prev); e.target.checked ? n.add(q.id) : n.delete(q.id); return n })}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0" />
                              <span className="text-sm text-gray-800 leading-tight">{q.title}</span>
                              {assignedCount > 0 && (
                                <span className="text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full flex-shrink-0">{assignedCount}/{students.length}</span>
                              )}
                            </div>
                          </td>
                          {students.map(s => {
                            const on = assigned.has(key(s.id, q.id))
                            return (
                              <td key={s.id} className="text-center px-2 py-2 border-r border-gray-100">
                                <button onClick={() => toggleCell(s.id, q.id)}
                                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mx-auto transition-all ${
                                    on ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 hover:border-purple-400'
                                  }`}>
                                  {on && <span className="text-xs font-bold">✓</span>}
                                </button>
                              </td>
                            )
                          })}
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

      <p className="text-xs text-gray-400">Changes save instantly. Students see questions assigned here plus any class-wide assignments.</p>
    </div>
  )
}
