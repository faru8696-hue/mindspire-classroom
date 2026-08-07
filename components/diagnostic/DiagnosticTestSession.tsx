'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import TopicBadge from './TopicBadge'
import ProgressDots from './ProgressDots'
import Watermark from './Watermark'
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

// Wall-clock elapsed time since the attempt started, not a plain client-side
// countdown — a countdown that just decrements from durationMinutes on
// mount resets to the full duration on every page load, which means closing
// the tab (or the browser crashing) and reopening the same attempt link
// hands the student a fresh full timer for free. Computing from started_at
// every time closes that loophole: however long they were away still counts
// against the clock.
//
// overtimeSeconds is display-only — whether an attempt actually counts as
// late, and by how much, is decided authoritatively server-side in
// submit-attempt (comparing submitted_at to started_at), never trusting
// this client value, same reasoning MCQ grading already follows.
function computeTimer(startedAt: string, durationMinutes: number): { secondsLeft: number; overtimeSeconds: number } {
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  const total = durationMinutes * 60
  return { secondsLeft: Math.max(0, total - elapsed), overtimeSeconds: Math.max(0, elapsed - total) }
}

// Deterministic per-(attempt, question) shuffle — mulberry32 seeded from a
// simple string hash, not Math.random(). Same student re-opening/navigating
// back to a question always sees the same option order (no re-shuffle
// flicker); a DIFFERENT student's attempt gets a different order for the
// same question, so "the answer is B" called across the room doesn't
// reliably point at the same option for whoever's listening. Grading is
// untouched — this only reorders what's rendered, and `pick()` below still
// records the option's original index, exactly as before.
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  let state = h >>> 0
  function rand() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function DiagnosticTestSession({
  slug, attemptId, testTitle, questions, durationMinutes, startedAt, studentName, studentEmail,
  initialAnswers, initialCanvasByQuestion, allowOvertime = false,
}: {
  slug: string
  attemptId: string
  testTitle: string
  questions: DiagnosticSessionQuestion[]
  durationMinutes: number
  startedAt: string
  studentName: string
  studentEmail: string
  // Autosaved progress from an earlier visit (closed tab, crashed browser,
  // switched devices) — restored on mount so the student resumes instead of
  // starting over. Empty on a genuinely fresh attempt.
  initialAnswers: { questionId: string; selectedIndex: number }[]
  initialCanvasByQuestion: { questionId: string; canvasData: string }[]
  // Teacher-controlled per-test setting: when true, reaching 0:00 does NOT
  // auto-submit — the student can keep answering. Whatever's submitted past
  // the limit is flagged for the teacher to explicitly accept or reject
  // before it can ever be released (see submit-attempt and
  // OvertimeReviewPanel) — this never silently grants extra credit.
  allowOvertime?: boolean
}) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, number>>(() => new Map(initialAnswers.map(a => [a.questionId, a.selectedIndex])))
  // Scratch work for every question, not just FRQ — MCQ questions get a
  // rough-work board alongside the options so students can work out
  // calculations without needing paper. It's saved with the answer either
  // way but never affects MCQ grading (that's still purely selectedIndex).
  const [canvasByQuestion, setCanvasByQuestion] = useState<Map<string, string | null>>(() => new Map(initialCanvasByQuestion.map(c => [c.questionId, c.canvasData])))
  const [timer, setTimer] = useState(() => computeTimer(startedAt, durationMinutes))
  const { secondsLeft, overtimeSeconds } = timer
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const canvasRef = useRef<ScratchBoardHandle>(null)
  const watermarkText = [studentName, studentEmail].filter(Boolean).join(' · ')

  // Neutral "left the test tab" counter — not a screenshot detector (no such
  // thing exists on the web), just visibilitychange/blur tracking, shown to
  // the teacher (and, with the integrity deduction below, the student and
  // parent) later as a plain fact ("left the tab N times, Xs total"), never
  // as an outright accusation. Refs, not state, since nothing here needs to
  // re-render — it's only read once, at submit time.
  //
  // A single away-event under AWAY_GRACE_SECONDS isn't counted at all — a
  // quick glance away (checking a periodic table on the wall, a stray
  // notification) is common and innocent, and penalizing it would make the
  // integrity deduction below fire on students who never actually cheated.
  const AWAY_GRACE_SECONDS = 5
  const tabSwitchCountRef = useRef(0)
  const tabSwitchSecondsRef = useRef(0)
  const awayRef = useRef(false)
  const awaySinceRef = useRef<number | null>(null)

  useEffect(() => {
    function markAway() {
      if (awayRef.current) return
      awayRef.current = true
      awaySinceRef.current = Date.now()
    }
    function markBack() {
      if (!awayRef.current) return
      awayRef.current = false
      if (awaySinceRef.current) {
        const seconds = Math.round((Date.now() - awaySinceRef.current) / 1000)
        awaySinceRef.current = null
        if (seconds >= AWAY_GRACE_SECONDS) {
          tabSwitchCountRef.current += 1
          tabSwitchSecondsRef.current += seconds
        }
      }
    }
    function onVisibility() { if (document.hidden) markAway(); else markBack() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', markAway)
    window.addEventListener('focus', markBack)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', markAway)
      window.removeEventListener('focus', markBack)
    }
  }, [])

  const q = questions[index]

  // { opt, originalIndex } pairs in shuffled display order — see
  // seededShuffle() above. Recomputed when the question changes, but always
  // yields the same order for the same (attemptId, question).
  const shuffledOptions = useMemo(() => {
    if (!q || q.questionType !== 'mcq' || !q.options) return []
    return seededShuffle(q.options.map((opt, originalIndex) => ({ opt, originalIndex })), `${attemptId}:${q.id}`)
  }, [q, attemptId])

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
        body: JSON.stringify({
          attemptId,
          answers: payload,
          tabSwitchCount: tabSwitchCountRef.current,
          tabSwitchSeconds: tabSwitchSecondsRef.current,
        }),
      })
      if (res.ok) {
        // replace, not push — so the back button from results skips over
        // this now-completed take page (which would otherwise still show
        // the last question) and lands wherever the student was before
        // starting the test.
        router.replace(`/diagnostic/${slug}/results/${attemptId}`)
        return
      }
    } catch {}
    submittingRef.current = false
    setSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, canvasByQuestion, questions, attemptId, slug, router])

  useEffect(() => {
    if (secondsLeft <= 0 && !allowOvertime) { handleSubmit(); return }
    // Recomputed from startedAt on every tick, not decremented by 1 — a
    // backgrounded/throttled tab can't drift the countdown out of sync with
    // real elapsed time, and it stays correct across a page reload too.
    // Depends on the whole `timer` object (not just secondsLeft) so ticking
    // keeps going once secondsLeft is pinned at 0 in overtime — only
    // overtimeSeconds is still changing at that point.
    const t = setTimeout(() => setTimer(computeTimer(startedAt, durationMinutes)), 1000)
    return () => clearTimeout(t)
  }, [timer, secondsLeft, allowOvertime, handleSubmit, startedAt, durationMinutes])

  // Periodic autosave — captures the current question's scratch board plus
  // every answer/canvas gathered so far and sends it to the server so a
  // closed tab or crashed browser doesn't lose the student's progress (see
  // /api/diagnostic/autosave-attempt). Fires on an interval rather than on
  // every keystroke/stroke to avoid spamming the endpoint while drawing.
  //
  // The interval itself is set up once ([] deps) so it isn't torn down and
  // restarted every second by the timer tick re-rendering this component —
  // that would keep resetting the 20s countdown and it would never actually
  // fire. It reads answers/canvasByQuestion/index through refs that mirror
  // the latest state instead of closing over the values from setup time.
  const answersRef = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])
  const canvasByQuestionRef = useRef(canvasByQuestion)
  useEffect(() => { canvasByQuestionRef.current = canvasByQuestion }, [canvasByQuestion])
  const indexRef = useRef(index)
  useEffect(() => { indexRef.current = index }, [index])

  useEffect(() => {
    const interval = setInterval(() => {
      if (submittingRef.current) return
      const currentQ = questions[indexRef.current]
      const finalCanvas = new Map(canvasByQuestionRef.current)
      if (currentQ) finalCanvas.set(currentQ.id, canvasRef.current?.getSnapshot() ?? finalCanvas.get(currentQ.id) ?? null)
      const payload = questions
        .map(qq => ({
          questionId: qq.id,
          selectedIndex: qq.questionType === 'mcq' ? answersRef.current.get(qq.id) : undefined,
          canvasData: finalCanvas.get(qq.id) ?? null,
        }))
        .filter(a => a.selectedIndex !== undefined || a.canvasData !== null)
      if (payload.length === 0) return
      fetch('/api/diagnostic/autosave-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers: payload }),
      }).catch(() => {})
    }, 20000)
    return () => clearInterval(interval)
  }, [attemptId, questions])

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
            {overtimeSeconds > 0 ? (
              <span className="text-sm font-mono px-2 py-1 rounded-full bg-orange-100 text-orange-700 animate-pulse" title="Time's up, but your teacher has allowed extra time. Anything you answer now will be flagged for them to review.">
                ⏰ +{formatClock(overtimeSeconds)} overtime
              </span>
            ) : (
              <span className={`text-sm font-mono px-2 py-1 rounded-full ${secondsLeft < 300 ? 'bg-red-100 text-red-600' : 'text-gray-500'}`}>
                ⏱ {formatClock(secondsLeft)}
              </span>
            )}
            <span className="text-sm font-semibold text-gray-600">{index + 1} / {questions.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <ProgressDots total={questions.length} current={index} answered={answeredSet} onJump={goTo} />

        <div className="relative overflow-hidden bg-white rounded-2xl shadow border border-gray-100 p-6">
          {watermarkText && <Watermark text={watermarkText} />}
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
                {shuffledOptions.map(({ opt, originalIndex }, displayIndex) => {
                  const selected = answers.get(q.id) === originalIndex
                  return (
                    <button
                      key={originalIndex}
                      onClick={() => pick(originalIndex)}
                      className={`w-full text-left px-5 py-4 border-2 rounded-xl text-gray-800 transition-transform hover:translate-x-1 ${
                        selected ? 'bg-blue-800 text-white border-blue-800' : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold mr-3 text-sm ${
                        selected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + displayIndex)}
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
