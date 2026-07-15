'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import AnswerKeyText from './AnswerKeyText'
import QuestionContent from './QuestionContent'
import ScratchBoard, { ScratchBoardHandle } from './ScratchBoard'

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

// Self-study flow, in two phases: ATTEMPT (work through every question with
// nothing revealed — MCQ just records your pick, FRQ gives you a scratch
// board to work on) then REVIEW (software-graded MCQ results + FRQ answer
// keys/self-grading, all after the fact). Nothing here touches
// submissions/feedback/grade_history — self-graded attempts are the
// student's own honesty-based assessment, not a teacher-verified grade.
export default function SelfCheckSession({
  questions, testId, backHref, doneHref, durationMinutes,
}: {
  questions: SessionQuestion[]
  testId: string | null
  backHref: string
  doneHref: string
  durationMinutes?: number | null
}) {
  const [phase, setPhase] = useState<'attempt' | 'review' | 'summary'>('attempt')
  const [index, setIndex] = useState(0)
  const [flagged, setFlagged] = useState<Set<string>>(new Set(questions.filter(q => q.flagged).map(q => q.id)))
  const [mcqSelections, setMcqSelections] = useState<Map<string, number>>(new Map())
  const [frqCanvas, setFrqCanvas] = useState<Map<string, string | null>>(new Map())
  const [mcqResults, setMcqResults] = useState<Map<string, { correct: boolean; correctIndex: number | null }>>(new Map())
  const [reviewResults, setReviewResults] = useState<Map<string, 'correct' | 'partial' | 'incorrect'>>(new Map())
  const [finishing, setFinishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes ? durationMinutes * 60 : null)
  const boardRef = useRef<ScratchBoardHandle>(null)

  const q = questions[index]

  useEffect(() => {
    if (phase !== 'attempt' || secondsLeft === null) return
    if (secondsLeft <= 0) { finishAttempt(); return }
    const t = setTimeout(() => setSecondsLeft(s => (s !== null ? s - 1 : s)), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase])

  const toggleFlag = useCallback(async (question: SessionQuestion) => {
    const next = !flagged.has(question.id)
    setFlagged(prev => {
      const copy = new Set(prev)
      if (next) copy.add(question.id); else copy.delete(question.id)
      return copy
    })
    fetch('/api/practice/flag', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, flagged: next }),
    }).catch(() => {})
  }, [flagged])

  async function finishAttempt() {
    if (finishing) return
    setFinishing(true)
    // Capture whatever's currently on the scratch board before leaving the attempt phase.
    if (q?.question_type === 'frq') {
      const snap = boardRef.current?.getSnapshot() ?? null
      setFrqCanvas(prev => new Map(prev).set(q.id, snap))
    }
    const mcqAnswers = [...mcqSelections.entries()].map(([questionId, selectedIndex]) => ({ questionId, selectedIndex }))
    try {
      const res = await fetch('/api/practice/finish-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, mcqAnswers }),
      })
      const data = await res.json()
      if (res.ok) {
        const resultMap = new Map<string, { correct: boolean; correctIndex: number | null }>()
        for (const r of data.results ?? []) resultMap.set(r.questionId, { correct: r.correct, correctIndex: r.correctIndex })
        setMcqResults(resultMap)
        const combined = new Map<string, 'correct' | 'incorrect'>()
        for (const [qid, r] of resultMap) combined.set(qid, r.correct ? 'correct' : 'incorrect')
        setReviewResults(prev => new Map([...prev, ...combined]))
      }
    } catch {}
    setFinishing(false)
    setIndex(0)
    setPhase(questions.length > 0 ? 'review' : 'summary')
  }

  function nextInAttempt() {
    if (q?.question_type === 'frq') {
      const snap = boardRef.current?.getSnapshot() ?? null
      setFrqCanvas(prev => new Map(prev).set(q.id, snap))
    }
    if (index >= questions.length - 1) {
      finishAttempt()
    } else {
      setIndex(i => i + 1)
    }
  }

  async function selfGradeAndAdvance(grade: 'correct' | 'partial' | 'incorrect') {
    setSaving(true)
    setReviewResults(prev => new Map(prev).set(q.id, grade))
    try {
      await fetch('/api/practice/self-grade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, testId, selfGrade: grade, canvasData: frqCanvas.get(q.id) ?? null }),
      })
    } catch {}
    setSaving(false)
    advanceInReview()
  }

  function advanceInReview() {
    if (index >= questions.length - 1) {
      setPhase('summary')
    } else {
      setIndex(i => i + 1)
    }
  }

  if (questions.length === 0) {
    return <p className="text-gray-500">Nothing here yet.</p>
  }

  if (phase === 'summary') {
    const correct = [...reviewResults.values()].filter(g => g === 'correct').length
    const partial = [...reviewResults.values()].filter(g => g === 'partial').length
    const incorrect = [...reviewResults.values()].filter(g => g === 'incorrect').length
    const pointsEarned = questions.reduce((sum, qq) => {
      const g = reviewResults.get(qq.id)
      return sum + (g === 'correct' ? qq.points : g === 'partial' ? qq.points * 0.5 : 0)
    }, 0)
    const totalPoints = questions.reduce((sum, qq) => sum + qq.points, 0)

    return (
      <div className="max-w-lg mx-auto text-center bg-white rounded-2xl border border-gray-200 p-8">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Session complete</h2>
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

  const headerBadges = (
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
  )

  if (phase === 'attempt') {
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
            {headerBadges}
            <button
              onClick={() => toggleFlag(q)}
              title={flagged.has(q.id) ? 'Unflag' : 'Flag for review'}
              className={`text-xl flex-shrink-0 ${flagged.has(q.id) ? 'opacity-100' : 'opacity-30 hover:opacity-70'} transition-opacity`}
            >
              🚩
            </button>
          </div>
          {q.content && <QuestionContent text={q.content} className="text-gray-600 mb-4" />}

          {q.question_type === 'mcq' ? (
            <div className="space-y-2 mb-4">
              {(q.mcq_options ?? []).map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setMcqSelections(prev => new Map(prev).set(q.id, i))}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                    mcqSelections.get(q.id) === i ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-4">
              <ScratchBoard key={q.id} ref={boardRef} initialDataUrl={frqCanvas.get(q.id) ?? null} />
            </div>
          )}

          <button
            onClick={nextInAttempt}
            disabled={finishing}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
          >
            {finishing ? 'Finishing…' : index >= questions.length - 1 ? 'Finish Test' : 'Next →'}
          </button>
        </div>
      </div>
    )
  }

  // phase === 'review'
  const mcqResult = mcqResults.get(q.id)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href={backHref} className="text-purple-600 text-sm hover:underline">← Exit</Link>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">Reviewing results</span>
        <span className="text-xs text-gray-400">{index + 1} / {questions.length}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-indigo-400 transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          {headerBadges}
          <button
            onClick={() => toggleFlag(q)}
            title={flagged.has(q.id) ? 'Unflag' : 'Flag for review'}
            className={`text-xl flex-shrink-0 ${flagged.has(q.id) ? 'opacity-100' : 'opacity-30 hover:opacity-70'} transition-opacity`}
          >
            🚩
          </button>
        </div>
        {q.content && <QuestionContent text={q.content} className="text-gray-600 mb-4" />}

        {q.question_type === 'mcq' ? (
          <div className="mt-2">
            <div className="space-y-2 mb-4">
              {(q.mcq_options ?? []).map((opt, i) => {
                const wasSelected = mcqSelections.get(q.id) === i
                const isCorrectOpt = mcqResult && i === mcqResult.correctIndex
                const isWrongPick = mcqResult && wasSelected && !mcqResult.correct
                return (
                  <div
                    key={i}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm ${
                      isCorrectOpt ? 'bg-green-50 border-green-300 text-green-800' :
                      isWrongPick ? 'bg-red-50 border-red-300 text-red-700' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    {opt}{wasSelected ? '  ← your answer' : ''}
                  </div>
                )
              })}
            </div>
            <button onClick={advanceInReview} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl">
              {mcqResult?.correct ? '✓ Correct — Next' : '✗ Incorrect — Next'}
            </button>
          </div>
        ) : (
          <div className="mt-2">
            {frqCanvas.get(q.id) && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Your work</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={frqCanvas.get(q.id) ?? undefined} alt="Your work" className="w-full rounded-xl border border-gray-200" />
              </div>
            )}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-purple-600 mb-2">Answer Key</p>
              {q.answer_key ? <AnswerKeyText text={q.answer_key} className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed" /> : <p className="text-sm text-gray-400">No answer key available.</p>}
            </div>
            <p className="text-sm text-gray-500 mb-2 text-center">How did you do?</p>
            <div className="grid grid-cols-3 gap-2">
              <button disabled={saving} onClick={() => selfGradeAndAdvance('correct')} className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-2.5 rounded-xl disabled:opacity-50">✓ Got it</button>
              <button disabled={saving} onClick={() => selfGradeAndAdvance('partial')} className="bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold py-2.5 rounded-xl disabled:opacity-50">~ Partial</button>
              <button disabled={saving} onClick={() => selfGradeAndAdvance('incorrect')} className="bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2.5 rounded-xl disabled:opacity-50">✗ Missed it</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
