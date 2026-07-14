'use client'

import { useState } from 'react'
import { renderBoardSnapshot } from '@/lib/renderBoardSnapshot'

interface StruggleItemProp {
  questionTitle: string
  questionContent: string | null
  answerKey: string | null
  topicTitle: string
  grade: string | null
  canvasData: string | null
  teacherCanvasData: string | null
  textAnswer: string | null
  teacherComment: string | null
}

interface Props {
  studentId: string
  displayName: string
  masterySummary: string
  struggleItems: StruggleItemProp[]
  initialReportText: string | null
  initialGeneratedAt: string | null
  hasParentEmail: boolean
}

function formatReportText(text: string) {
  // Turn "Section Name:" lines into a small heading, matching the plain-text
  // convention generateDeepStudentReport is prompted to produce.
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  return paragraphs.map((p, i) => {
    const m = p.match(/^([A-Za-z][A-Za-z /]{2,40}):\s*([\s\S]*)$/)
    if (m) {
      const [, heading, rest] = m
      return (
        <div key={i} className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-purple-600 mb-1">{heading}</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{rest}</p>
        </div>
      )
    }
    return <p key={i} className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">{p}</p>
  })
}

export default function DeepReviewPanel({
  studentId, displayName, masterySummary, struggleItems, initialReportText, initialGeneratedAt, hasParentEmail,
}: Props) {
  const [reportText, setReportText] = useState(initialReportText)
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [emailing, setEmailing] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [emailError, setEmailError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const items = []
      for (let i = 0; i < struggleItems.length; i++) {
        const s = struggleItems[i]
        setProgress(`Reading work ${i + 1} of ${struggleItems.length}…`)
        const boardImageDataUrl = s.canvasData
          ? await renderBoardSnapshot(s.canvasData, s.teacherCanvasData)
          : null
        items.push({
          questionTitle: s.questionTitle,
          questionContent: s.questionContent,
          answerKey: s.answerKey,
          topicTitle: s.topicTitle,
          grade: s.grade,
          boardImageDataUrl,
          textAnswer: s.textAnswer,
          teacherComment: s.teacherComment,
        })
      }

      setProgress('Analyzing with AI…')
      const res = await fetch('/api/generate-deep-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, displayName, masterySummary, items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate report')
      setReportText(data.reportText)
      setGeneratedAt(new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setGenerating(false)
      setProgress('')
    }
  }

  async function handleEmail() {
    setEmailing(true)
    setEmailStatus('idle')
    setEmailError(null)
    try {
      const res = await fetch('/api/email-parent-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send email')
      setEmailStatus('sent')
    } catch (err) {
      setEmailStatus('error')
      setEmailError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setEmailing(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 print:hidden">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-bold text-gray-800">Deep Review — Actual Struggle Analysis</h2>
          <p className="text-xs text-gray-400">
            AI reads {displayName}&apos;s actual submitted work (not just grades) to diagnose specific misconceptions.
          </p>
        </div>
      </div>

      {struggleItems.length === 0 && !reportText && (
        <p className="text-sm text-gray-400 mt-4">No struggling or ungraded work yet — nothing to analyze.</p>
      )}

      {(struggleItems.length > 0 || reportText) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || struggleItems.length === 0}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
          >
            {generating ? (progress || 'Working…') : reportText ? '🔄 Regenerate Deep Review' : '🤖 Generate Deep Review'}
          </button>
          <button
            onClick={handleEmail}
            disabled={emailing || !hasParentEmail || !reportText}
            title={!hasParentEmail ? "This student hasn't added a parent email yet" : !reportText ? 'Generate the deep review first' : undefined}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
          >
            {emailing ? 'Sending…' : emailStatus === 'sent' ? '✓ Sent to parent' : '📧 Email to Parent'}
          </button>
          {!hasParentEmail && (
            <span className="text-xs text-amber-600">No parent email on file for this student.</span>
          )}
          {generatedAt && (
            <span className="text-xs text-gray-400">Last generated {new Date(generatedAt).toLocaleString()}</span>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {emailStatus === 'error' && emailError && <p className="text-sm text-red-600 mt-2">{emailError}</p>}

      {reportText && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          {formatReportText(reportText)}
        </div>
      )}
    </section>
  )
}
