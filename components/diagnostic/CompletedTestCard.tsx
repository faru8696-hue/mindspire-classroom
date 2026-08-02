import Link from 'next/link'

export default function CompletedTestCard({
  slug, title, description, attemptId, scorePct, classTitle,
}: {
  slug: string
  title: string
  description: string | null
  attemptId: string
  scorePct: number
  classTitle?: string
}) {
  return (
    <Link
      href={`/diagnostic/${slug}/results/${attemptId}`}
      className="flex items-center justify-between gap-3 bg-gray-50 hover:bg-purple-50 rounded-lg p-3 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{title}</p>
        {classTitle && <p className="text-xs text-purple-500 mt-0.5">{classTitle}</p>}
        {description && <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>}
      </div>
      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
        ✓ {Math.round(scorePct)}%
      </span>
    </Link>
  )
}
