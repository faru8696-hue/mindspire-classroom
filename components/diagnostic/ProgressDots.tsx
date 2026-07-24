'use client'

// Answered/current/unanswered dot row shown above the active question,
// clickable to jump directly to any question.
export default function ProgressDots({
  total, current, answered, onJump,
}: {
  total: number
  current: number
  answered: Set<number>
  onJump: (index: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === current
        const isAnswered = answered.has(i)
        const cls = isCurrent
          ? 'bg-amber-500 scale-125'
          : isAnswered
            ? 'bg-blue-500'
            : 'bg-gray-300'
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            title={`Question ${i + 1}`}
            className={`w-3 h-3 rounded-full transition-transform ${cls}`}
          />
        )
      })}
    </div>
  )
}
