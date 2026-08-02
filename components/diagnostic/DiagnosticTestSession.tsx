'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import TopicBadge from './TopicBadge'
import ProgressDots from './ProgressDots'
import ScratchBoard, { ScratchBoardHandle } from '../ScratchBoard'

export interface DiagnosticSessionQuestion {
  id: string
  content: string
  imageUrl: string | null
  questionType: 'mcq' | 'frq'
  options: string[] | null
  topicId: string
  topicTitle: string
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function DiagnosticTestSession({
  slug, attemptId, testTitle, questions, durationMinutes,
}: {
  slug: string
  attemptId: string
  testTitle: string
  questions: DiagnosticSessionQuestion[]
  durationMinutes: number
}) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, number>>(new Map())
  // Scratch work for every question, not just FRQ — MCQ questions get a
  // rough-work board alongside the options so students can work out
  // calculations without needing paper. It's saved with the answer either
  // way but never affects MCQ grading (that's still purely selectedIndex).
  const [canvasByQuestion, setCanvasByQuestion] = useState<Map<string, string | null>>(new Map())
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const canvasRef = useRef<ScratchBoardHandle>(null)

  const q = questions[index]
  const answeredSet = new Set(
    questions
      .map((qq, i) => {
        // FRQ is "answered" only once there's scratch work (that IS the
        // answer); MCQ counts as answered once an option is picked —
        // rough-work on an MCQ question doesn't count toward this.
        const answered = qq.questionType === 'frq' ? !!canvasByQuestion.get(qq.id) : answers.has(qq.id)
        return answered ? i : -1
      })
      .filter(i => i >= 0)
  )

  // Grabs whatever's currently on the scratch board before navigating away
  // — mirrors SelfCheckSession's capture-on-navigate pattern, since React
  // state updates from setCanvasByQuestion wouldn't be visible within the
  // same function call otherwise.
  function captureCurrentCanvas(map: Map<string, string | null>): Map<string, string | null> {
    if (!q) return map
    const next = new Map(map)
    next.set(q.id, canvasRef.current?.getSnapshot() ?? null)
    return next
  }

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const finalCanvas = captureCurrentCanvas(canvasByQuestion)
      setCanvasByQuestion(finalCanvas)
      const payload = questions.map(qq => ({
        questionId: qq.id,
        selectedIndex: qq.questionType === 'mcq' ? answers.get(qq.id) : undefined,
        canvasData: finalCanvas.get(qq.id) ?? null,
      }))
      const res = await fetch('/api/diagnostic/submit-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers: payload }),
      })
      if (res.ok) {
        router.push(`/diagnostic/${slug}/results/${attemptId}`)
        return
      }
    } catch {}
    submittingRef.current = false
    setSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, canvasByQuestion, questions, attemptId, slug, router])

  useEffect(() => {
    if (secondsLeft <= 0) { handleSubmit(); return }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, handleSubmit])

  function pick(optionIndex: number) {
    setAnswers(prev => new Map(prev).set(q.id, optionIndex))
  }
  function goTo(target: number) {
    setCanvasByQuestion(prev => captureCurrentCanvas(prev))
    setIndex(target)
  }
  function next() { if (index < questions.length - 1) goTo(index + 1) }
  function prev() { if (index > 0) goTo(index - 1) }

  function confirmSubmit() {
    const answeredCount = questions.filter(qq =>
      qq.questionType === 'frq' ? (qq.id === q.id ? true : !!canvasByQuestion.get(qq.id)) : answers.has(qq.id)
    ).length
    const unanswered = questions.length - answeredCount
    if (unanswered > 0 && !confirm(`${unanswered} question${unanswered === 1 ? '' : 's'} unanswered. Submit anyway?`)) return
    handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-600 text-lg">🧪</span>
            <span className="font-bold text-gray-800 text-sm">{testTitle}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-mono px-2 py-1 rounded-full ${secondsLeft < 300 ? 'bg-red-100 text-red-600' : 'text-gray-500'}`}>
              ⏱ {formatClock(secondsLeft)}
            </span>
            <span className="text-sm font-semibold text-gray-600">{index + 1} / {questions.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <ProgressDots total={questions.length} current={index} answered={answeredSet} onJump={goTo} />

        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <div className="flex gap-2 flex-wrap mb-4">
            <TopicBadge topicId={q.topicId} label={q.topicTitle} />
            <span className="text-xs text-gray-400 px-2 py-1">Q{index + 1}</span>
          </div>

          {q.imageUrl && (
            <div
              className="w-full mb-5 flex justify-center select-none"
              onContextMenu={e => e.preventDefault()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.imageUrl} alt="Question diagram" loading="lazy" draggable={false}
                className="max-w-full max-h-[420px] object-contain rounded-lg border border-gray-200 bg-gray-50" />
            </div>
          )}

          {/* select-none + blocked copy/context-menu/drag — a plain deterrent
              against casually pasting the question into another app, not a
              hard barrier (screenshots/retyping still work, same as any
              client-side measure). */}
          <p
            className="text-gray-800 font-medium text-base leading-relaxed mb-6 whitespace-pre-wrap select-none"
            onCopy={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
          >
            {q.content}
          </p>

          {q.questionType === 'frq' ? (
            <ScratchBoard key={q.id} ref={canvasRef} initialDataUrl={canvasByQuestion.get(q.id) ?? null} />
          ) : (
            // Options beside a rough-work board on wide screens (stacked on
            // narrow ones) — a scratch space for calculations instead of
            // needing paper, saved with the answer but never graded.
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-3 select-none" onCopy={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
                {(q.options ?? []).map((opt, i) => {
                  const selected = answers.get(q.id) === i
                  return (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      className={`w-full text-left px-5 py-4 border-2 rounded-xl text-gray-800 transition-transform hover:translate-x-1 ${
                        selected ? 'bg-blue-800 text-white border-blue-800' : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold mr-3 text-sm ${
                        selected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  )
                })}
              </div>
              <ScratchBoard key={q.id} ref={canvasRef} initialDataUrl={canvasByQuestion.get(q.id) ?? null} label="🧮 Rough work" />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pb-8">
          <button onClick={prev} disabled={index === 0}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition disabled:opacity-40">
            ← Prev
          </button>
          <button onClick={confirmSubmit} disabled={submitting}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition text-sm disabled:opacity-50">
            {submitting ? 'Submitting…' : '🏁 Submit'}
          </button>
          <button onClick={next} disabled={index === questions.length - 1}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-40">
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
