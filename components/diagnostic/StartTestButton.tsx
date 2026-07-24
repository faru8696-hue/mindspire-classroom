'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StartTestButton({
  slug, title, description,
}: {
  slug: string
  title: string
  description: string | null
}) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)

  async function start() {
    setStarting(true)
    try {
      const res = await fetch('/api/diagnostic/start-attempt-for-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Missing contact info on file (or any other snag) — fall back to
        // the normal public intake form rather than getting stuck.
        router.push(`/diagnostic/${slug}`)
        return
      }
      router.push(`/diagnostic/${slug}/take/${data.attemptId}`)
    } catch {
      router.push(`/diagnostic/${slug}`)
    }
  }

  return (
    <button
      onClick={start}
      disabled={starting}
      className="w-full flex items-center justify-between gap-3 bg-gray-50 hover:bg-purple-50 rounded-lg p-3 transition-colors text-left disabled:opacity-60"
    >
      <div>
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <span className="text-purple-600 text-sm font-semibold flex-shrink-0">
        {starting ? 'Starting…' : 'Start →'}
      </span>
    </button>
  )
}
