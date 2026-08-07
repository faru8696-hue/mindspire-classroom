'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s}s`
}

// Shown on the teacher attempt page whenever an attempt was submitted after
// its time limit (only possible when the test's allow_overtime was on).
// Accept/Reject is a distinct decision from the "Release Results" toggle —
// this is about whether the score is valid at all; release-results and
// email-result both refuse to release it until this is explicitly true.
export default function OvertimeReviewPanel({
  attemptId, overtimeSeconds, overtimeAccepted,
}: {
  attemptId: string
  overtimeSeconds: number
  overtimeAccepted: boolean | null
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function decide(accepted: boolean) {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/set-overtime-accepted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, accepted }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSaving(false); return }
      router.refresh()
    } catch {
      setError('Connection error.')
      setSaving(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-orange-800">⏰ Overtime Submission</p>
          <p className="text-sm text-orange-700 mt-0.5">
            Submitted <span className="font-semibold">{formatDuration(overtimeSeconds)}</span> after the time limit. This score won&rsquo;t be releasable to the student or parent until you accept or reject it.
          </p>
          {overtimeAccepted === true && <p className="text-xs font-semibold text-green-700 mt-1">✓ Accepted — can be released normally.</p>}
          {overtimeAccepted === false && <p className="text-xs font-semibold text-red-700 mt-1">✗ Rejected — cannot be released.</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => decide(true)}
            disabled={saving}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
              overtimeAccepted === true ? 'bg-green-600 text-white' : 'bg-white border border-green-300 text-green-700 hover:bg-green-50'
            }`}
          >
            ✓ Accept
          </button>
          <button
            onClick={() => decide(false)}
            disabled={saving}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
              overtimeAccepted === false ? 'bg-red-600 text-white' : 'bg-white border border-red-300 text-red-700 hover:bg-red-50'
            }`}
          >
            ✗ Reject
          </button>
        </div>
      </div>
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  )
}
