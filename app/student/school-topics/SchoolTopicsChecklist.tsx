'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ClassRow { id: string; title: string; order_index: number }
interface UnitRow { id: string; class_id: string; title: string; order_index: number }
interface TopicRow { id: string; unit_id: string; title: string; order_index: number }
interface PlanRow { topicId: string; testDate: string | null }

interface Props {
  studentId: string
  classes: ClassRow[]
  units: UnitRow[]
  topics: TopicRow[]
  initialPlans: PlanRow[]
}

export default function SchoolTopicsChecklist({ studentId, classes, units, topics, initialPlans }: Props) {
  const supabase = createClient()
  // topicId -> test_date (or null). Presence in the map = "my school covers this topic".
  const [selections, setSelections] = useState<Map<string, string | null>>(
    () => new Map(initialPlans.map(p => [p.topicId, p.testDate]))
  )
  const [savingTopic, setSavingTopic] = useState<string | null>(null)
  const [savedTopic, setSavedTopic] = useState<string | null>(null)

  function flashSaved(topicId: string) {
    setSavedTopic(topicId)
    setTimeout(() => setSavedTopic(prev => (prev === topicId ? null : prev)), 1500)
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

  return (
    <div className="space-y-6">
      {sortedClasses.map(cls => {
        const classUnits = units.filter(u => u.class_id === cls.id).sort((a, b) => a.order_index - b.order_index)
        const checkedCount = classUnits.reduce(
          (sum, u) => sum + topics.filter(t => t.unit_id === u.id && selections.has(t.id)).length,
          0,
        )

        return (
          <div key={cls.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
              <h2 className="font-bold text-purple-900">{cls.title}</h2>
              <span className="text-xs text-purple-600">{checkedCount} topic{checkedCount === 1 ? '' : 's'} selected</span>
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
                    return (
                      <div key={topic.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50">
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
