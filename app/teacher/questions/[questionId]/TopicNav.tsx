'use client'

import { useRouter } from 'next/navigation'

interface TopicEntry { id: string; title: string; firstQuestionId: string | null }
interface UnitEntry { id: string; title: string; topics: TopicEntry[] }

interface Props {
  navUnits: UnitEntry[]
  currentUnitId: string
  currentTopicId: string
}

// Breadcrumb replacement for the question-review page: lets a teacher jump to
// any unit/topic in the class directly (assigned or not — "unlive" questions
// included), instead of having to go back through the Content page each time.
export default function TopicNav({ navUnits, currentUnitId, currentTopicId }: Props) {
  const router = useRouter()

  const currentUnit = navUnits.find(u => u.id === currentUnitId) ?? navUnits[0]
  const topicsInUnit = currentUnit?.topics ?? []
  const currentTopicIndex = topicsInUnit.findIndex(t => t.id === currentTopicId)

  function goToTopic(topicId: string) {
    const unit = navUnits.find(u => u.topics.some(t => t.id === topicId))
    const topic = unit?.topics.find(t => t.id === topicId)
    if (topic?.firstQuestionId) router.push(`/teacher/questions/${topic.firstQuestionId}`)
  }

  function goToUnit(unitId: string) {
    const unit = navUnits.find(u => u.id === unitId)
    const firstTopic = unit?.topics.find(t => t.firstQuestionId)
    if (firstTopic?.firstQuestionId) router.push(`/teacher/questions/${firstTopic.firstQuestionId}`)
  }

  function step(delta: number) {
    const nextIndex = currentTopicIndex + delta
    if (nextIndex >= 0 && nextIndex < topicsInUnit.length) {
      goToTopic(topicsInUnit[nextIndex].id)
      return
    }
    // fall off the end of this unit's topics — hop to the adjacent unit
    const unitIndex = navUnits.findIndex(u => u.id === currentUnitId)
    const nextUnitIndex = unitIndex + delta
    const nextUnit = navUnits[nextUnitIndex]
    if (!nextUnit) return
    const edgeTopic = delta > 0 ? nextUnit.topics[0] : nextUnit.topics[nextUnit.topics.length - 1]
    if (edgeTopic?.firstQuestionId) router.push(`/teacher/questions/${edgeTopic.firstQuestionId}`)
  }

  const selectCls = 'bg-transparent border border-gray-200 rounded-md px-2 py-1 text-sm hover:border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={currentUnitId}
        onChange={e => goToUnit(e.target.value)}
        className={`${selectCls} text-gray-500`}
        title="Jump to a different unit"
      >
        {navUnits.map(u => (
          <option key={u.id} value={u.id}>{u.title}</option>
        ))}
      </select>
      <span>›</span>
      <button
        onClick={() => step(-1)}
        disabled={currentTopicIndex <= 0 && navUnits.findIndex(u => u.id === currentUnitId) <= 0}
        className="text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed px-1"
        title="Previous topic"
      >
        ‹
      </button>
      <select
        value={currentTopicId}
        onChange={e => goToTopic(e.target.value)}
        className={`${selectCls} text-gray-700 font-medium`}
        title="Jump to a different topic (includes unassigned topics)"
      >
        {topicsInUnit.map(t => (
          <option key={t.id} value={t.id} disabled={!t.firstQuestionId}>
            {t.title}{!t.firstQuestionId ? ' (no questions)' : ''}
          </option>
        ))}
      </select>
      <button
        onClick={() => step(1)}
        className="text-gray-400 hover:text-purple-600 px-1"
        title="Next topic"
      >
        ›
      </button>
    </div>
  )
}
