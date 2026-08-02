'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { QuestionReviewItem } from './DiagnosticResultSummary'
import FrqAnnotatorModal from './FrqAnnotatorModal'

function frqBadge(points: number | null, pointsEarned: number | null): { label: string; cls: string } {
  if (pointsEarned === null) return { label: '📝 Ungraded', cls: 'bg-purple-100 text-purple-700' }
  if (points !== null && pointsEarned >= points) return { label: `✓ ${pointsEarned}/${points} pts`, cls: 'bg-green-100 text-green-700' }
  if (pointsEarned <= 0) return { label: `${pointsEarned}/${points ?? '?'} pts`, cls: 'bg-red-100 text-red-600' }
  return { label: `${pointsEarned}/${points ?? '?'} pts`, cls: 'bg-amber-100 text-amber-700' }
}

// Points-entry control for one FRQ answer — local draft state so typing
// doesn't round-trip to the server on every keystroke; only Save commits it
// and refreshes the page's frq score/badge.
function FrqScoreInput({
  attemptId, questionId, points, pointsEarned, onSaved,
}: {
  attemptId: string
  questionId: string
  points: number | null
  pointsEarned: number | null
  onSaved: () => void
}) {
  const [value, setValue] = useState(pointsEarned !== null ? String(pointsEarned) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setError('')
    const trimmed = value.trim()
    const num = trimmed === '' ? null : Number(trimmed)
    if (num !== null && (Number.isNaN(num) || num < 0 || (points !== null && num > points))) {
      setError(`Enter 0–${points ?? 'any'}.`)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/grade-frq-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, questionId, pointsEarned: num }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSaving(false); return }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      <span className="text-xs font-semibold text-gray-500">Score:</span>
      <input
        type="number" min={0} max={points ?? undefined} step={0.5}
        value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save() }}
        className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
      <span className="text-xs text-gray-400">/ {points ?? '?'} pts</span>
      <button
        onClick={save}
        disabled={saving}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

// Collapsed by default — a 90-question attempt would otherwise dump a huge
// wall of content onto the results page before the student even sees their
// score. Wrong answers are sorted first since that's what's actually useful
// to review; correct ones are still included so the list matches "all
// questions", not just a filtered subset. `canGrade` (teacher view only)
// turns on the FRQ points input — students see the same score, if entered,
// as a read-only badge.
export default function QuestionReviewList({
  questions, canGrade = false, attemptId,
}: {
  questions: QuestionReviewItem[]
  canGrade?: boolean
  attemptId?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [annotatingId, setAnnotatingId] = useState<string | null>(null)
  if (questions.length === 0) return null

  const annotatingQuestion = questions.find(q => q.questionId === annotatingId) ?? null

  // FRQ items have isCorrect: null (nothing to grade) — sort ungraded ones
  // first in teacher view (most actionable), otherwise after the MCQ ones.
  const sorted = [...questions].sort((a, b) => {
    if (canGrade) {
      const aUngraded = a.questionType === 'frq' && a.pointsEarned === null
      const bUngraded = b.questionType === 'frq' && b.pointsEarned === null
      if (aUngraded !== bUngraded) return aUngraded ? -1 : 1
    }
    return Number(a.isCorrect ?? 2) - Number(b.isCorrect ?? 2)
  })
  const wrongCount = questions.filter(q => q.questionType === 'mcq' && !q.isCorrect).length
  const ungradedFrqCount = questions.filter(q => q.questionType === 'frq' && q.pointsEarned === null).length

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-lg font-bold text-gray-800">
          📝 Review {canGrade ? 'Student' : 'Your'} Answers
          {wrongCount > 0 && <span className="text-sm font-normal text-gray-500 ml-2">({wrongCount} incorrect)</span>}
          {canGrade && ungradedFrqCount > 0 && <span className="text-sm font-normal text-purple-600 ml-2">({ungradedFrqCount} FRQ to grade)</span>}
        </h3>
        <span className="text-gray-400 text-sm font-semibold">{open ? 'Hide ▲' : 'Show ▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {sorted.map(q => {
            const badge = q.questionType === 'frq' ? frqBadge(q.points, q.pointsEarned) : null
            return (
              <div
                key={q.questionId}
                className={`rounded-xl border p-4 ${
                  q.questionType === 'frq'
                    ? (q.pointsEarned === null ? 'border-purple-100 bg-purple-50/30' : q.pointsEarned >= (q.points ?? 0) ? 'border-green-100 bg-green-50/30' : q.pointsEarned <= 0 ? 'border-red-100 bg-red-50/30' : 'border-amber-100 bg-amber-50/30')
                    : q.isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    badge ? badge.cls : q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {badge ? badge.label : q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.content}</p>
                </div>
                {q.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.imageUrl} alt="" className="max-h-64 rounded-lg border border-gray-200 mb-2 object-contain bg-white" />
                )}
                {q.questionType === 'frq' ? (
                  <>
                    {/* Stacked (not side by side) so the work image can run
                        full width — legible handwriting matters more here
                        than fitting the answer key alongside it. */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-500">
                          Student&rsquo;s Work{q.teacherAnnotation && <span className="text-purple-600"> · ✏️ annotated</span>}
                        </p>
                        {canGrade && attemptId && q.canvasData && (
                          <button
                            onClick={() => setAnnotatingId(q.questionId)}
                            className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                          >
                            ✏️ {q.teacherAnnotation ? 'Edit annotation' : 'Annotate'}
                          </button>
                        )}
                      </div>
                      {q.teacherAnnotation || q.canvasData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={q.teacherAnnotation ?? q.canvasData ?? ''} alt="Student's work" className="w-full rounded-lg border border-gray-200 bg-white" />
                      ) : (
                        <p className="text-sm text-gray-400 italic">No work submitted.</p>
                      )}
                    </div>
                    {q.answerKey && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Answer Key</p>
                        <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-2 whitespace-pre-wrap">📖 {q.answerKey}</p>
                      </div>
                    )}
                    {canGrade && attemptId && (
                      <FrqScoreInput
                        attemptId={attemptId}
                        questionId={q.questionId}
                        points={q.points}
                        pointsEarned={q.pointsEarned}
                        onSaved={() => router.refresh()}
                      />
                    )}
                  </>
                ) : (
                  <div className="space-y-1 mb-2">
                    {(q.options ?? []).map((opt, idx) => {
                      const isCorrectOpt = idx === q.correctIndex
                      const isSelectedOpt = idx === q.selectedIndex
                      return (
                        <div
                          key={idx}
                          className={`text-sm px-2 py-1 rounded flex items-center gap-1.5 ${
                            isCorrectOpt ? 'bg-green-100 text-green-800 font-semibold' :
                            isSelectedOpt ? 'bg-red-100 text-red-700 font-semibold' :
                                            'text-gray-600'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                          {isCorrectOpt && <span>✓</span>}
                          {isSelectedOpt && !isCorrectOpt && <span>← your answer</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
                {q.questionType === 'mcq' && q.canvasData && (
                  <details className="mt-2">
                    <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700">🧮 Rough work</summary>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={q.canvasData} alt="Rough work" className="w-full max-w-md rounded-lg border border-gray-200 bg-white mt-1" />
                  </details>
                )}
                {q.questionType === 'mcq' && q.explanation && (
                  <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-2 mt-2">💡 {q.explanation}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
      {annotatingQuestion && attemptId && (
        <FrqAnnotatorModal
          attemptId={attemptId}
          questionId={annotatingQuestion.questionId}
          startingImage={annotatingQuestion.teacherAnnotation ?? annotatingQuestion.canvasData ?? ''}
          onClose={() => setAnnotatingId(null)}
        />
      )}
    </div>
  )
}
