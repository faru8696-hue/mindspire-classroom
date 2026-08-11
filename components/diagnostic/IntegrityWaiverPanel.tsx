'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// A plain fact, not an accusation — tab/window focus loss is a weak,
// high-false-positive signal (checking a calculator, a notification, an
// accidental alt-tab all trigger it too), so the count itself is always
// shown neutrally. The waive toggle only appears when that behavior
// actually triggered a score deduction (rawDeductionPct > 0) — waiving it
// zeroes the deduction everywhere the score is shown or sent (see
// lib/diagnosticResult.ts) without erasing the underlying tab-switch count.
export default function IntegrityWaiverPanel({
  attemptId, tabSwitchCount, tabSwitchSeconds, rawDeductionPct, likelyCheating, waived,
}: {
  attemptId: string
  tabSwitchCount: number
  tabSwitchSeconds: number
  rawDeductionPct: number
  likelyCheating: boolean
  waived: boolean
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function setWaived(next: boolean) {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/set-integrity-waived', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, waived: next }),
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

  if (tabSwitchCount === 0) return null

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔀</span>
        <p className="text-sm text-gray-600">
          Left the test tab <span className="font-semibold text-gray-800">{tabSwitchCount}</span> time{tabSwitchCount === 1 ? '' : 's'}
          {tabSwitchSeconds > 0 && <> · <span className="font-semibold text-gray-800">{tabSwitchSeconds}s</span> total away</>}
        </p>
      </div>

      {rawDeductionPct > 0 && (
        <div className="flex items-start justify-between gap-3 flex-wrap pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 max-w-sm">
            {waived
              ? <>✓ The {rawDeductionPct}% deduction this triggered is <span className="font-semibold text-green-700">waived</span> — the student/parent see the undeducted score.</>
              : <>This triggered a <span className="font-semibold text-amber-700">{rawDeductionPct}% deduction</span>{likelyCheating ? ' and was flagged as likely cheating' : ''}, applied to the score shown and sent to the parent.</>}
          </p>
          <button
            onClick={() => setWaived(!waived)}
            disabled={saving}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex-shrink-0 ${
              waived ? 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100' : 'bg-white border border-green-300 text-green-700 hover:bg-green-50'
            }`}
          >
            {saving ? 'Saving…' : waived ? 'Restore Deduction' : 'Waive Deduction'}
          </button>
        </div>
      )}
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}
