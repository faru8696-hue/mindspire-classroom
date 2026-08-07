'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// A curated starting point, not an exhaustive taxonomy — a teacher can
// always fall back to the free-text note for anything not covered here.
const COMMON_ISSUES = [
  'Struggled to show work clearly on free-response questions',
  'Did not show any work',
  'Rushed through questions — answers seem incomplete',
  'Left several questions unanswered (time management)',
  'Correct final answers but reasoning/work not shown',
  'Difficulty with multiple-choice reasoning / process of elimination',
  'Careless errors — understood the concept but made a calculation mistake',
  'Answer missing units',
  'Struggled with units or significant figures',
  'Misread or misunderstood what the question was asking',
  'Confused similar concepts or formulas',
  'Guessed on several multiple-choice questions rather than working through them',
  'Would benefit from reviewing class notes/practice problems before the next test',
  'Recommend a short one-on-one review session to go over missed topics',
  'Strong effort and consistent performance — keep it up',
]

export default function EmailResultButton({
  attemptId, studentEmail, parentEmail, studentName, weakTopics, hasFrq,
}: {
  attemptId: string
  studentEmail: string
  parentEmail: string
  studentName: string
  // Topic titles from the attempt's non-mastered advice list, worst-first —
  // turned into one extra clickable option per topic so the teacher isn't
  // stuck re-typing "needs more practice with X" from scratch.
  weakTopics: string[]
  // Whether this attempt has any FRQ questions at all — the MCQ/FRQ scope
  // picker only makes sense to show when there's actually a choice.
  hasFrq: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customNote, setCustomNote] = useState('')
  const [includeMcq, setIncludeMcq] = useState(true)
  const [includeFrq, setIncludeFrq] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const topicIssues = weakTopics.map(t => `Needs more practice with ${t}`)
  const allIssues = [...COMMON_ISSUES, ...topicIssues]

  function toggle(issue: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(issue)) next.delete(issue)
      else next.add(issue)
      return next
    })
  }

  const composedNote = [
    [...selected].map(s => `• ${s}`).join('\n'),
    customNote.trim(),
  ].filter(Boolean).join('\n\n')

  async function send() {
    if (!includeMcq && !includeFrq) { setError('Include at least Multiple Choice or Free Response.'); return }
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/diagnostic/admin/email-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, teacherNote: composedNote || null, includeMcq, includeFrq: hasFrq ? includeFrq : false }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSending(false); return }
      setSent(true)
      setOpen(false)
      setTimeout(() => setSent(false), 5000)
      // Sending the email also releases the results (see the API route) —
      // refresh so the release toggle next to this button picks that up.
      router.refresh()
    } catch {
      setError('Connection error.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className={`text-sm font-semibold px-4 py-2 rounded-xl transition ${
          sent ? 'bg-green-100 text-green-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {sent ? '✓ Sent' : '✉️ Email Results to Student & Parent'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !sending && setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="font-bold text-gray-800">Review Before Sending</h3>
              <p className="text-xs text-gray-500 mt-1">To {studentEmail} and {parentEmail}</p>
            </div>

            {hasFrq && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What to share</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIncludeMcq(v => !v)}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border font-semibold transition-colors ${
                      includeMcq ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                    }`}
                  >
                    {includeMcq ? '✓ ' : ''}Multiple Choice score
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeFrq(v => !v)}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border font-semibold transition-colors ${
                      includeFrq ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300'
                    }`}
                  >
                    {includeFrq ? '✓ ' : ''}Free Response score
                  </button>
                </div>
                {!(includeMcq && includeFrq) && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    Partial send — only the selected score{includeMcq || includeFrq ? '' : 's'} will be shared, and the full in-app results page will stay hidden until you send both (or release it separately).
                  </p>
                )}
              </div>
            )}

            {allIssues.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Common issues <span className="normal-case font-normal text-gray-400">— click any that apply, optional</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {allIssues.map(issue => (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => toggle(issue)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors text-left ${
                        selected.has(issue)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {issue}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Additional note (optional)</p>
              <textarea
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                rows={3}
                placeholder={`Any other context for ${studentName}'s parent...`}
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {composedNote && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview — note included in the email</p>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-xs text-purple-900 whitespace-pre-wrap">{composedNote}</div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={send}
                disabled={sending || (!includeMcq && !includeFrq)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send to Student & Parent'}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={sending}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
