'use client'

import { useState } from 'react'
import type { QuestionReviewItem } from './DiagnosticResultSummary'

// Collapsed by default — a 90-question attempt would otherwise dump a huge
// wall of content onto the results page before the student even sees their
// score. Wrong answers are sorted first since that's what's actually useful
// to review; correct ones are still included so the list matches "all
// questions", not just a filtered subset.
export default function QuestionReviewList({ questions }: { questions: QuestionReviewItem[] }) {
  const [open, setOpen] = useState(false)
  if (questions.length === 0) return null

  // FRQ items have isCorrect: null (nothing to grade) — sort them after the
  // MCQ ones, which are wrong-first same as before.
  const sorted = [...questions].sort((a, b) => Number(a.isCorrect ?? 2) - Number(b.isCorrect ?? 2))
  const wrongCount = questions.filter(q => q.questionType === 'mcq' && !q.isCorrect).length

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-lg font-bold text-gray-800">
          📝 Review Your Answers
          {wrongCount > 0 && <span className="text-sm font-normal text-gray-500 ml-2">({wrongCount} to review)</span>}
        </h3>
        <span className="text-gray-400 text-sm font-semibold">{open ? 'Hide ▲' : 'Show ▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {sorted.map(q => (
            <div
              key={q.questionId}
              className={`rounded-xl border p-4 ${
                q.questionType === 'frq' ? 'border-purple-100 bg-purple-50/30' :
                q.isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  q.questionType === 'frq' ? 'bg-purple-100 text-purple-700' :
                  q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {q.questionType === 'frq' ? '📝 Free response' : q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
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
