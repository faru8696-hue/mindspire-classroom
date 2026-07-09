'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import InfiniteWhiteboard, { InfiniteWhiteboardHandle } from '@/components/InfiniteWhiteboard'
import { GRADE_LIST } from '@/lib/grades'

interface Props {
  classId: string
  questionId: string
  studentId: string
  questionTitle: string
  questionContent: string | null
  submissionId: string | null
  initialStudentData: string | null
  initialTeacherData: string | null
  initialGrade: string | null
  initialFeedbackText: string | null
}

// Extract image URLs from canvas JSON (objects with type='image' and a non-empty data URL)
function extractImages(canvasJson: string | null): string[] {
  if (!canvasJson) return []
  try {
    const objs = JSON.parse(canvasJson) as { type: string; data?: string }[]
    return objs
      .filter(o => o.type === 'image' && o.data && !o.data.startsWith('data:'))
      .map(o => o.data as string)
  } catch { return [] }
}

export default function TeacherWatchBoard({
  classId, questionId, studentId, questionTitle, questionContent,
  initialStudentData, initialTeacherData,
  initialGrade, initialFeedbackText,
}: Props) {
  const supabase = createClient()
  const gradeChannel = supabase.channel(`live-grades:${classId}:${questionId}`)
  const gradeNotifChannel = supabase.channel(`grade-notif:${questionId}:${studentId}`)
  const [grade, setGrade] = useState<string | null>(initialGrade)
  const [feedbackText, setFeedbackText] = useState(initialFeedbackText ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [studentData, setStudentData] = useState(initialStudentData)
  const boardRef = useRef<InfiniteWhiteboardHandle>(null)
  const [aiChecking, setAiChecking] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{ grade: string; feedback: string } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Extract image URLs from canvas JSON — updates whenever studentData changes
  const uploadedImages = useMemo(() => extractImages(studentData), [studentData])

  // Subscribe broadcast channels so send() works
  useEffect(() => {
    gradeChannel.subscribe()
    gradeNotifChannel.subscribe()
    return () => { supabase.removeChannel(gradeChannel); supabase.removeChannel(gradeNotifChannel) }
  }, [])

  // Pull the student's latest saved work via the service-role API on an interval.
  // We can't use realtime postgres_changes here: the submissions table is RLS-gated
  // with no working SELECT policy, so the teacher client never receives those events
  // — which left the live board blank for already-saved work until the student drew
  // again (the only path that updates it is the in-memory broadcast while drawing).
  // Polling the service-role endpoint reliably surfaces saved work even when the
  // student isn't actively drawing. Remount the board (boardKey) only when the data
  // actually changed so the teacher's in-progress feedback isn't disrupted.
  useEffect(() => {
    let active = true
    let last = studentData
    async function poll() {
      try {
        const res = await fetch(`/api/submission?questionId=${questionId}&studentId=${studentId}`)
        if (!res.ok || !active) return
        const { canvasData } = await res.json() as { canvasData: string | null }
        if (canvasData && canvasData !== last) {
          last = canvasData
          // Update the data prop only — InfiniteWhiteboard refreshes the student
          // layer in place, so the teacher's own annotations are never reset.
          setStudentData(canvasData)
        }
      } catch {}
    }
    const interval = setInterval(poll, 4000)
    return () => { active = false; clearInterval(interval) }
  }, [questionId, studentId])

  async function saveTeacher(dataUrl: string) {
    // Service-role API write — the feedback table is not writable by the client under RLS.
    // The route resolves (and creates if needed) the submission, so no submissionId is required.
    await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, questionId, canvasData: dataUrl }),
    })
  }

  async function persistGrade(newGrade: string | null, feedback: string) {
    // Save grade + feedback and notify the student via the service-role API.
    const res = await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        questionId,
        grade: newGrade,
        textFeedback: feedback || null,
        notify: true,
      }),
    })
    // Live broadcasts so the teacher live view and the student board update instantly.
    await gradeChannel.send({
      type: 'broadcast', event: 'grade-update',
      payload: { student_id: studentId, grade: newGrade },
    })
    if (newGrade) {
      await gradeNotifChannel.send({ type: 'broadcast', event: 'grade-update', payload: { grade: newGrade, feedback } })
    }
    return res.ok
  }

  async function applyGrade(g: string) {
    const newGrade = grade === g ? null : g
    setGrade(newGrade)
    setSaving(true)
    const ok = await persistGrade(newGrade, feedbackText)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  async function saveFeedback() {
    setSaving(true)
    const ok = await persistGrade(grade, feedbackText)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  // AI reads a snapshot of the board and suggests a grade + feedback — a
  // SUGGESTION only. Nothing is saved or sent to the student until the
  // teacher reviews it and clicks "Use this" (or edits it first), same as
  // grading manually.
  async function runAiCheck() {
    const snapshot = boardRef.current?.getSnapshot()
    if (!snapshot) return
    setAiChecking(true)
    setAiError(null)
    setAiSuggestion(null)
    try {
      const res = await fetch('/api/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionTitle, questionContent, boardImageDataUrl: snapshot }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI check failed')
      setAiSuggestion(data)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI check failed')
    } finally {
      setAiChecking(false)
    }
  }

  // The teacher reviewing the suggestion and clicking this IS the human
  // approval step — it applies the AI's grade/feedback exactly like
  // clicking the grade buttons manually would (same save + notify path).
  async function acceptAiSuggestion() {
    if (!aiSuggestion) return
    const { grade: newGrade, feedback } = aiSuggestion
    setGrade(newGrade)
    setFeedbackText(feedback)
    setAiSuggestion(null)
    setSaving(true)
    const ok = await persistGrade(newGrade, feedback)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Uploaded images strip — shown directly, no button needed */}
      {uploadedImages.length > 0 && (
        <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center gap-3 overflow-x-auto flex-shrink-0">
          <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">Uploaded:</span>
          {uploadedImages.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Student upload ${i + 1}`}
              className="h-24 w-auto rounded-lg cursor-pointer border border-gray-600 hover:border-blue-400 transition-colors object-contain bg-white"
              onClick={() => setLightbox(url)}
            />
          ))}
          <span className="text-xs text-gray-500 whitespace-nowrap">Click to enlarge</span>
        </div>
      )}

      {/* Whiteboard */}
      <div className="flex-1 min-h-0">
        <InfiniteWhiteboard
          ref={boardRef}
          questionId={questionId}
          studentId={studentId}
          role="teacher"
          initialStudentData={studentData}
          initialTeacherData={initialTeacherData}
          onSaveTeacher={saveTeacher}
        />
      </div>

      {/* AI suggestion banner — appears after "AI Check", stays out of the
          way until the teacher reviews and either applies or dismisses it.
          Nothing here is saved or sent to the student on its own. */}
      {(aiChecking || aiSuggestion || aiError) && (
        <div className="bg-indigo-950 border-t border-indigo-700 px-4 py-2.5 flex-shrink-0">
          {aiChecking && <p className="text-xs text-indigo-300">🤖 Reading the board…</p>}
          {aiError && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-red-400">🤖 {aiError}</p>
              <button onClick={() => setAiError(null)} className="text-xs text-gray-400 hover:text-white">✕</button>
            </div>
          )}
          {aiSuggestion && (
            <div className="flex items-start gap-3">
              <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${aiSuggestion.grade === 'correct' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                AI: {aiSuggestion.grade === 'correct' ? '✓ Correct' : '✗ Wrong'}
              </span>
              <p className="flex-1 text-xs text-indigo-100">{aiSuggestion.feedback}</p>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={acceptAiSuggestion} className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap">
                  Use this
                </button>
                <button onClick={() => setAiSuggestion(null)} className="text-xs px-2.5 py-1 rounded-lg text-gray-400 hover:text-white">
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grading bar */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={runAiCheck}
            disabled={aiChecking}
            title="Have AI read the board and suggest a grade + feedback"
            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white whitespace-nowrap"
          >
            {aiChecking ? '🤖 Checking…' : '🤖 AI Check'}
          </button>
          <span className="text-xs text-gray-400 font-semibold mr-1">Grade:</span>
          {/* Segmented control — one joined bar, flat fill only on the
              selected option, instead of five separate mismatched pills. */}
          <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
            {GRADE_LIST.map((g, i) => (
              <button
                key={g.value}
                onClick={() => applyGrade(g.value)}
                className={`text-xs px-3 py-1.5 font-semibold transition-colors ${i > 0 ? 'border-l border-gray-700' : ''} ${grade === g.value ? g.solid : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[160px] flex items-center gap-2 ml-2">
            <input
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveFeedback()}
              placeholder="Add feedback note..."
              className="flex-1 bg-gray-800 border border-gray-600 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
            />
            <button
              onClick={saveFeedback}
              disabled={saving}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            >
              {saved ? '✓ Saved' : saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Student upload" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center">×</button>
        </div>
      )}
    </div>
  )
}
