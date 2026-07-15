'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AnswerKeyText from './AnswerKeyText'

export interface SessionQuestion {
  id: string
  title: string
  content: string | null
  answer_key: string | null
  difficulty: string | null
  points: number
  flagged: boolean
  question_type: 'frq' | 'mcq'
  mcq_options: string[] | null
}

const DIFFICULTY_BADGE: Record<string, { label: string; cls: string }> = {
  easy:   { label: 'Easy',   cls: 'bg-sky-100 text-sky-700' },
  medium: { label: 'Medium', cls: 'bg-orange-100 text-orange-700' },
  hard:   { label: 'Hard',   cls: 'bg-rose-100 text-rose-700' },
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Shared self-study flow for both a built test and the review folder. FRQ
// questions are self-checked against the answer key (never touches
// submissions/feedback/grade_history — this is the student's own honesty-
// based assessment, not a teacher-verified grade). MCQ questions are graded
// instantly by the server (app/api/practice/mcq-grade) instead.
export default function SelfCheckSession({
  questions, testId, backHref, doneHref, durationMinutes,
}: {
  questions: SessionQuestion[]
  testId: string | null
  backHref: string
  doneHref: string
  durationMinutes?: number | null
}) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<Map<string, 'correct' | 'partial' | 'incorrect'>>(new Map())
  const [flagged, setFlagged] = useState<Set<string>>(new Set(questions.filter(q => q.flagged).map(q => q.id)))
  const [saving, setSaving] = useState(false)
  const [mcqSelected, setMcqSelected] = useState<number | null>(null)
  const [mcqResult, setMcqResult] = useState<{ correct: boolean; correctIndex: number } | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes ? durationMinutes * 60 : null)
  const [timedOut, setTimedOut] = useState(false)

  const q = questions[index]
  const finished = index >= questions.length || timedOut

  useEffect(() => {
    if (secondsLeft === null || finished) return
    if (secondsLeft <= 0) { setTimedOut(true); return }
    const t = setTimeout(() => setSecondsLeft(s => (s !== null ? s - 1 : s)), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, finished])

  const toggleFlag = useCallback(async () => {
    const next = !flagged.has(q.id)
    setFlagged(prev => {
      const copy = new Set(prev)
      if (next) copy.add(q.id); else copy.delete(q.id)
      return copy
    })
    fetch('/api/practice/flag', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id, flagged: next }),
    }).catch(() => {})
  }, [q, flagged])

  function advance() {
    setRevealed(false)
    setMcqSelected(null)
    setMcqResult(null)
    setIndex(i => i + 1)
  }

  async function submitMcq() {
    if (mcqSelected === null || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/practice/mcq-grade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, testId, selectedIndex: mcqSelected }),
      })
      const data = await res.json()
      setMcqResult(data)
      setResults(prev => new Map(prev).set(q.id, data.correct ? 'correct' : 'incorrect'))
    } catch {}
    setSaving(false)
  }

  async function selfGrade(grade: 'correct' | 'partial' | 'incorrect') {
    setSaving(true)
    setResults(prev => new Map(prev).set(q.id, grade))
    try {
      await fetch('/api/practice/self-grade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, testId, selfGrade: grade }),
      })
    } catch {}
    setSaving(false)
    advance()
  }

  if (questions.length === 0) {
    return <p className="text-gray-500">Nothing here yet.</p>
  }

  if (finished) {
    const correct = [...results.values()].filter(g => g === 'correct').length
    const partial = [...results.values()].filter(g => g === 'partial').length
    const incorrect = [...results.values()].filter(g => g === 'incorrect').length
    const answered = results.size
    const pointsEarned = questions.reduce((sum, qq) => {
      const g = results.get(qq.id)
      return sum + (g === 'correct' ? qq.points : g === 'partial' ? qq.points * 0.5 : 0)
    }, 0)
    const totalPoints = questions.reduce((sum, qq) => sum + qq.points, 0)

    return (
      <div className="max-w-lg mx-auto text-center bg-white rounded-2xl border border-gray-200 p-8">
        <div className="text-4xl mb-2">{timedOut ? '⏰' : '🎉'}</div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{timedOut ? "Time's up!" : 'Session complete'}</h2>
        {timedOut && <p className="text-xs text-gray-400 mb-2">{answered}/{questions.length} answered before time ran out</p>}
        <p className="text-sm text-gray-500 mb-4">{pointsEarned} / {totalPoints} points</p>
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">✓ {correct} correct</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">~ {partial} partial</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">✗ {incorrect} missed</span>
        </div>
        <Link href={doneHref} className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl">
          Done
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href={backHref} className="text-purple-600 text-sm hover:underline">← Exit</Link>
        <div className="flex items-center gap-3">
          {secondsLeft !== null && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${secondsLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
              ⏱ {formatClock(secondsLeft)}
            </span>
          )}
          <span className="text-xs text-gray-400">{index + 1} / {questions.length}</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-purple-400 transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-gray-800 text-lg">{q.title}</h2>
            {q.difficulty && DIFFICULTY_BADGE[q.difficulty] && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${DIFFICULTY_BADGE[q.difficulty].cls}`}>
                {DIFFICULTY_BADGE[q.difficulty].label} · {q.points}pt{q.points === 1 ? '' : 's'}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-500">
              {q.question_type === 'mcq' ? 'MCQ' : 'FRQ'}
            </span>
          </div>
          <button
            onClick={toggleFlag}
            title={flagged.has(q.id) ? 'Unflag' : 'Flag for review'}
            className={`text-xl flex-shrink-0 ${flagged.has(q.id) ? 'opacity-100' : 'opacity-30 hover:opacity-70'} transition-opacity`}
          >
            🚩
          </button>
        </div>
        {q.content && <p className="text-gray-600 mb-4">{q.content}</p>}

        {q.question_type === 'mcq' ? (
          <div className="mt-2">
            <div className="space-y-2 mb-4">
              {(q.mcq_options ?? []).map((opt, i) => {
                const isSelected = mcqSelected === i
                const isCorrectOpt = mcqResult && i === mcqResult.correctIndex
                const isWrongPick = mcqResult && isSelected && !mcqResult.correct
                return (
                  <button
                    key={i}
                    disabled={!!mcqResult}
                    onClick={() => setMcqSelected(i)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      isCorrectOpt ? 'bg-green-50 border-green-300 text-green-800' :
                      isWrongPick ? 'bg-red-50 border-red-300 text-red-700' :
                      isSelected ? 'bg-purple-50 border-purple-300' :
                      'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {!mcqResult ? (
              <button
                onClick={submitMcq}
                disabled={mcqSelected === null || saving}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
              >
                Submit Answer
              </button>
            ) : (
              <button onClick={advance} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl">
                {mcqResult.correct ? '✓ Correct — Next' : '✗ Incorrect — Next'}
              </button>
            )}
          </div>
        ) : !revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
          >
            Show Answer
          </button>
        ) : (
          <div className="mt-2">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-purple-600 mb-2">Answer Key</p>
              {q.answer_key ? <AnswerKeyText text={q.answer_key} className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed" /> : <p className="text-sm text-gray-400">No answer key available.</p>}
            </div>
            <p className="text-sm text-gray-500 mb-2 text-center">How did you do?</p>
            <div className="grid grid-cols-3 gap-2">
              <button disabled={saving} onClick={() => selfGrade('correct')} className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-2.5 rounded-xl disabled:opacity-50">✓ Got it</button>
              <button disabled={saving} onClick={() => selfGrade('partial')} className="bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold py-2.5 rounded-xl disabled:opacity-50">~ Partial</button>
              <button disabled={saving} onClick={() => selfGrade('incorrect')} className="bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2.5 rounded-xl disabled:opacity-50">✗ Missed it</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
