// Colored pill badge for a topic name, cycling through a fixed palette keyed
// by a stable string (topicId) so the same topic always gets the same color
// within one test session. No `difficulty` concept here — diagnostic_questions
// is deliberately unweighted/undifferentiated by difficulty (see schema).
const PALETTE = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-red-100 text-red-800',
  'bg-orange-100 text-orange-800',
  'bg-teal-100 text-teal-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
]

function colorFor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export default function TopicBadge({ topicId, label }: { topicId: string; label: string }) {
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${colorFor(topicId)}`}>
      {label}
    </span>
  )
}
