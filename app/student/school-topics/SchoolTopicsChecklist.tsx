'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ClassRow { id: string; title: string; order_index: number }
interface UnitRow { id: string; class_id: string; title: string; order_index: number }
interface TopicRow { id: string; unit_id: string; title: string; order_index: number }
interface PlanRow { topicId: string; testDate: string | null }
interface StatusRow { classId: string; notStarted: boolean; startsOn: string | null; otherTopics: string }
interface ClassStatus { notStarted: boolean; startsOn: string; otherTopics: string }

interface Props {
  studentId: string
  classes: ClassRow[]
  units: UnitRow[]
  topics: TopicRow[]
  initialPlans: PlanRow[]
  initialStatus: StatusRow[]
}

const todayIso = () => new Date().toISOString().slice(0, 10)

export default function SchoolTopicsChecklist({ studentId, classes, units, topics, initialPlans, initialStatus }: Props) {
  const supabase = createClient()
  // topicId -> test_date (or null). Presence in the map = "my school covers this topic".
  const [selections, setSelections] = useState<Map<string, string | null>>(
    () => new Map(initialPlans.map(p => [p.topicId, p.testDate]))
  )
  const [statusByClass, setStatusByClass] = useState<Map<string, ClassStatus>>(
    () => new Map(initialStatus.map(s => [s.classId, { notStarted: s.notStarted, startsOn: s.startsOn ?? '', otherTopics: s.otherTopics }]))
  )
  const [savingTopic, setSavingTopic] = useState<string | null>(null)
  const [savedTopic, setSavedTopic] = useState<string | null>(null)
  const [savingStatusClass, setSavingStatusClass] = useState<string | null>(null)
  const [savedStatusClass, setSavedStatusClass] = useState<string | null>(null)

  function flashSaved(topicId: string) {
    setSavedTopic(topicId)
    setTimeout(() => setSavedTopic(prev => (prev === topicId ? null : prev)), 1500)
  }

  function flashStatusSaved(classId: string) {
    setSavedStatusClass(classId)
    setTimeout(() => setSavedStatusClass(prev => (prev === classId ? null : prev)), 1500)
  }

  function getStatus(classId: string): ClassStatus {
    return statusByClass.get(classId) ?? { notStarted: false, startsOn: '', otherTopics: '' }
  }

  async function saveStatus(classId: string, next: ClassStatus) {
    setSavingStatusClass(classId)
    const { error } = await supabase.from('student_school_status')
      .upsert({
        student_id: studentId, class_id: classId,
        not_started: next.notStarted, starts_on: next.startsOn || null, other_topics: next.otherTopics || null,
      }, { onConflict: 'student_id,class_id' })
    setSavingStatusClass(null)
    if (!error) {
      setStatusByClass(prev => new Map(prev).set(classId, next))
      flashStatusSaved(classId)
    }
  }

  function toggleNotStarted(classId: string) {
    const current = getStatus(classId)
    saveStatus(classId, { ...current, notStarted: !current.notStarted })
  }

  function updateStartsOnDraft(classId: string, date: string) {
    setStatusByClass(prev => new Map(prev).set(classId, { ...getStatus(classId), startsOn: date }))
  }

  function saveStartsOn(classId: string) {
    saveStatus(classId, getStatus(classId))
  }

  function updateOtherTopicsDraft(classId: string, text: string) {
    setStatusByClass(prev => new Map(prev).set(classId, { ...getStatus(classId), otherTopics: text }))
  }

  function saveOtherTopicsOnBlur(classId: string) {
    saveStatus(classId, getStatus(classId))
  }

  async function toggle(topicId: string, classId: string) {
    const isSelected = selections.has(topicId)
    setSavingTopic(topicId)
    if (isSelected) {
      const { error } = await supabase.from('student_topic_plans').delete()
        .eq('student_id', studentId).eq('topic_id', topicId)
      if (!error) {
        setSelections(prev => { const m = new Map(prev); m.delete(topicId); return m })
        flashSaved(topicId)
      }
    } else {
      const { error } = await supabase.from('student_topic_plans')
        .upsert({ student_id: studentId, class_id: classId, topic_id: topicId, test_date: null }, { onConflict: 'student_id,topic_id' })
      if (!error) {
        setSelections(prev => new Map(prev).set(topicId, null))
        flashSaved(topicId)
      }
    }
    setSavingTopic(null)
  }

  async function updateTestDate(topicId: string, date: string) {
    setSelections(prev => new Map(prev).set(topicId, date || null))
    setSavingTopic(topicId)
    const { error } = await supabase.from('student_topic_plans')
      .update({ test_date: date || null })
      .eq('student_id', studentId).eq('topic_id', topicId)
    setSavingTopic(null)
    if (!error) flashSaved(topicId)
  }

  const sortedClasses = [...classes].sort((a, b) => a.order_index - b.order_index)
  const today = todayIso()

  return (
    <div className="space-y-6">
      {sortedClasses.map(cls => {
        const classUnits = units.filter(u => u.class_id === cls.id).sort((a, b) => a.order_index - b.order_index)
        const checkedCount = classUnits.reduce(
          (sum, u) => sum + topics.filter(t => t.unit_id === u.id && selections.has(t.id)).length,
          0,
        )
        const status = getStatus(cls.id)
        const isStatusSaving = savingStatusClass === cls.id
        const isStatusSaved = savedStatusClass === cls.id
        const startsOnExpired = status.notStarted && !!status.startsOn && status.startsOn < today

        return (
          <div key={cls.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
              <h2 className="font-bold text-purple-900">{cls.title}</h2>
              <span className="text-xs text-purple-600">{checkedCount} topic{checkedCount === 1 ? '' : 's'} selected</span>
            </div>

            <div className="px-5 py-3 border-b border-gray-100 space-y-3">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status.notStarted}
                    disabled={isStatusSaving}
                    onChange={() => toggleNotStarted(cls.id)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-400 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-800">My school hasn&apos;t started this class yet</span>
                  {isStatusSaved && status.notStarted && <span className="text-xs text-green-600">✓</span>}
                </label>
                {status.notStarted && (
                  <div className="mt-2 ml-7 flex items-center gap-1.5">
                    <label className="text-xs text-gray-500">When do you expect it to start? (optional)</label>
                    <input
                      type="date"
                      value={status.startsOn}
                      onChange={e => updateStartsOnDraft(cls.id, e.target.value)}
                      onBlur={() => saveStartsOn(cls.id)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-700"
                    />
                  </div>
                )}
                {startsOnExpired && (
                  <p className="mt-1.5 ml-7 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-block">
                    ⏰ You said around {status.startsOn} — has it started yet?
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Something else your school covers that&apos;s not on the list below?</label>
                <textarea
                  value={status.otherTopics}
                  onChange={e => updateOtherTopicsDraft(cls.id, e.target.value)}
                  onBlur={() => saveOtherTopicsOnBlur(cls.id)}
                  placeholder="Optional — describe it here"
                  rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
                />
                {isStatusSaved && status.otherTopics.trim() && <span className="text-xs text-green-600">✓ Saved</span>}
              </div>
            </div>

            {classUnits.length === 0 && (
              <p className="text-sm text-gray-400 px-5 py-4">No topics added for this class yet.</p>
            )}

            {classUnits.map(unit => {
              const unitTopics = topics.filter(t => t.unit_id === unit.id).sort((a, b) => a.order_index - b.order_index)
              if (unitTopics.length === 0) return null
              return (
                <div key={unit.id} className="border-b border-gray-100 last:border-0">
                  <p className="px-5 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">{unit.title}</p>
                  {unitTopics.map(topic => {
                    const isChecked = selections.has(topic.id)
                    const testDate = selections.get(topic.id) ?? ''
                    const isSaving = savingTopic === topic.id
                    const isSaved = savedTopic === topic.id
                    const isExpired = isChecked && !!testDate && testDate < today
                    return (
                      <div key={topic.id} className="px-5 py-2.5 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isSaving}
                              onChange={() => toggle(topic.id, cls.id)}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-400 flex-shrink-0"
                            />
                            <span className="text-sm text-gray-800 truncate">{topic.title}</span>
                          </label>
                          {isChecked && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <label className="text-xs text-gray-500">Test date:</label>
                              <input
                                type="date"
                                value={testDate}
                                onChange={e => updateTestDate(topic.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 text-gray-700"
                              />
                            </div>
                          )}
                          {isSaved && <span className="text-xs text-green-600 flex-shrink-0">✓</span>}
                        </div>
                        {isExpired && (
                          <p className="mt-1.5 ml-7 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-block">
                            ⏰ Test passed — still on this, or has your school moved on?
                          </p>
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

      {sortedClasses.length === 0 && <p className="text-gray-500">No classes found.</p>}
    </div>
  )
}
