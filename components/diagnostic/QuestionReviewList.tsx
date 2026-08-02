'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { QuestionReviewItem } from './DiagnosticResultSummary'

const GRADE_OPTIONS: { value: 'correct' | 'partial' | 'incorrect'; label: string; cls: string }[] = [
  { value: 'correct', label: '✓ Correct', cls: 'bg-green-600 text-white' },
  { value: 'partial', label: '~ Partial', cls: 'bg-amber-500 text-white' },
  { value: 'incorrect', label: '✗ Incorrect', cls: 'bg-red-500 text-white' },
]

// Collapsed by default — a 90-question attempt would otherwise dump a huge
// wall of content onto the results page before the student even sees their
// score. Wrong answers are sorted first since that's what's actually useful
// to review; correct ones are still included so the list matches "all
// questions", not just a filtered subset. `canGrade` (teacher view only)
// turns on the FRQ grading buttons — students see the same grade, if set,
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
  const [saving, setSaving] = useState<string | null>(null)
  if (questions.length === 0) return null

  async function setGrade(questionId: string, grade: 'correct' | 'partial' | 'incorrect') {
    if (!attemptId) return
    setSaving(questionId)
    try {
      const res = await fetch('/api/diagnostic/admin/grade-frq-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, questionId, grade }),
      })
      if (res.ok) router.refresh()
    } finally {
      setSaving(null)
    }
  }

  // FRQ items have isCorrect: null (nothing to grade) — sort ungraded ones
  // first in teacher view (most actionable), otherwise after the MCQ ones.
  const sorted = [...questions].sort((a, b) => {
    if (canGrade) {
      const aUngraded = a.questionType === 'frq' && a.grade === null
      const bUngraded = b.questionType === 'frq' && b.grade === null
      if (aUngraded !== bUngraded) return aUngraded ? -1 : 1
    }
    return Number(a.isCorrect ?? 2) - Number(b.isCorrect ?? 2)
  })
  const wrongCount = questions.filter(q => q.questionType === 'mcq' && !q.isCorrect).length
  const ungradedFrqCount = questions.filter(q => q.questionType === 'frq' && q.grade === null).length

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
          {sorted.map(q => (
            <div
              key={q.questionId}
              className={`rounded-xl border p-4 ${
                q.questionType === 'frq'
                  ? (q.grade === 'correct' ? 'border-green-100 bg-green-50/30' : q.grade === 'incorrect' ? 'border-red-100 bg-red-50/30' : 'border-purple-100 bg-purple-50/30')
                  : q.isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  q.questionType === 'frq'
                    ? (GRADE_OPTIONS.find(g => g.value === q.grade)?.cls ?? 'bg-purple-100 text-purple-700')
                    : q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {q.questionType === 'frq'
                    ? (GRADE_OPTIONS.find(g => g.value === q.grade)?.label ?? '📝 Ungraded')
                    : q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.content}</p>
              </div>
              {q.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.imageUrl} alt="" className="max-h-64 rounded-lg border border-gray-200 mb-2 object-contain bg-white" />
              )}
              {q.questionType === 'frq' ? (
                <>
                  {q.canvasData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.canvasData} alt="Student's work" className="w-full rounded-lg border border-gray-200 mb-2 bg-white" />
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-2">No work submitted.</p>
                  )}
                  {q.answerKey && (
                    <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-2 mt-2 whitespace-pre-wrap">📖 {q.answerKey}</p>
                  )}
                  {canGrade && (
                    <div className="flex items-center gap-2 mt-3">
                      {GRADE_OPTIONS.map(g => (
                        <button
                          key={g.value}
                          onClick={() => setGrade(q.questionId, g.value)}
                          disabled={saving === q.questionId}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
                            q.grade === g.value ? g.cls : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                      {saving === q.questionId && <span className="text-xs text-gray-400">Saving…</span>}
                    </div>
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
              {q.questionType === 'mcq' && q.explanation && (
                <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-2 mt-2">💡 {q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
