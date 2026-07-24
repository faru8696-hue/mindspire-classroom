const PERFORMANCE = [
  { min: 80, label: 'Excellent',  text: 'text-green-600',  bg: 'bg-green-50' },
  { min: 70, label: 'Proficient', text: 'text-blue-600',   bg: 'bg-blue-50' },
  { min: 60, label: 'Developing', text: 'text-yellow-600', bg: 'bg-yellow-50' },
  { min: 0,  label: 'Needs Work', text: 'text-red-600',    bg: 'bg-red-50' },
]

function performanceFor(pct: number) {
  return PERFORMANCE.find(p => pct >= p.min)!
}

export default function ScoreCard({
  correctCount, totalCount, scorePct, timeSpentSeconds,
}: {
  correctCount: number
  totalCount: number
  scorePct: number
  timeSpentSeconds?: number | null
}) {
  const p = performanceFor(scorePct)
  return (
    <div className={`inline-block ${p.bg} rounded-2xl px-10 py-6`}>
      <div className={`text-6xl font-black ${p.text}`}>{scorePct}%</div>
      <div className="text-2xl font-bold text-gray-700 mt-1">{correctCount}/{totalCount}</div>
      <div className={`text-lg font-bold ${p.text} mt-1`}>{p.label}</div>
      {timeSpentSeconds != null && (
        <div className="text-sm text-gray-500 mt-1">
          Time: {Math.floor(timeSpentSeconds / 60)}m {timeSpentSeconds % 60}s
        </div>
      )}
    </div>
  )
}
