import type { MasteryTier } from '@/lib/diagnosticGrading'

const TIER_STYLE: Record<MasteryTier, { bar: string; label: string; text: string }> = {
  mastered:    { bar: 'bg-green-500',  label: 'Mastered',    text: 'text-green-700' },
  developing:  { bar: 'bg-yellow-500', label: 'Developing',  text: 'text-yellow-700' },
  'needs-work': { bar: 'bg-red-500',   label: 'Needs Work',  text: 'text-red-700' },
}

export default function MasteryBar({
  topicTitle, correct, total, pct, tier,
}: {
  topicTitle: string
  correct: number
  total: number
  pct: number
  tier: MasteryTier
}) {
  const style = TIER_STYLE[tier]
  return (
    <div>
      <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
        <span>{topicTitle}</span>
        <span className={`font-bold ${style.text}`}>{correct}/{total} ({pct}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className={`h-3 rounded-full ${style.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
