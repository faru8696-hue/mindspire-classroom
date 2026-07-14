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

interface TrendPointProp { date: string; pct: number; cumulativeGraded: number }
interface TopicComparisonProp { topicId: string; title: string; studentPct: number; classAvgPct: number; classSize: number }
interface ClassBreakdownProp { classId: string; className: string; overallPct: number; correct: number; partial: number; incorrect: number; graded: number; role: 'foundational' | 'advanced' | null }

interface Props {
  studentId: string
  displayName: string
  struggleItems: StruggleItemProp[]
  initialReportText: string | null
  initialGeneratedAt: string | null
  hasParentEmail: boolean
  trend: TrendPointProp[]
  classComparison: { classAvgOverallPct: number; classSize: number; perTopic: TopicComparisonProp[] } | null
  overallPct: number
  classBreakdown: ClassBreakdownProp[]
  isFoundationalAdvancedPairing: boolean
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

// Simple inline SVG line chart — no charting library needed for a handful
// of points, and it stays crisp on print/PDF export.
function TrendChart({ trend }: { trend: TrendPointProp[] }) {
  if (trend.length < 2) return null
  const W = 560, H = 140, PAD = 28
  const xStep = (W - PAD * 2) / (trend.length - 1)
  const yOf = (pct: number) => H - PAD - (pct / 100) * (H - PAD * 2)
  const points = trend.map((p, i) => `${PAD + i * xStep},${yOf(p.pct)}`).join(' ')
  const first = trend[0].pct, last = trend[trend.length - 1].pct
  const trendColor = last > first ? '#16a34a' : last < first ? '#dc2626' : '#6b7280'

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36">
        {/* gridlines at 0/50/100% */}
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line x1={PAD} x2={W - PAD} y1={yOf(v)} y2={yOf(v)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={2} y={yOf(v) + 3} fontSize={9} fill="#9ca3af">{v}%</text>
          </g>
        ))}
        <polyline points={points} fill="none" stroke={trendColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {trend.map((p, i) => (
          <circle key={i} cx={PAD + i * xStep} cy={yOf(p.pct)} r={3} fill={trendColor} />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 px-1 -mt-1">
        <span>{new Date(trend[0].date).toLocaleDateString()}</span>
        <span>{new Date(trend[trend.length - 1].date).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

function gaugeColor(pct: number): string {
  if (pct >= 80) return '#16a34a'
  if (pct >= 50) return '#d97706'
  return '#dc2626'
}

// Radial "gauge" — an infographic-style alternative to the line/bar charts,
// good for an at-a-glance per-class stat card.
function DonutGauge({ pct, size = 96 }: { pct: number; size?: number }) {
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = gaugeColor(pct)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size * 0.24} fontWeight={700} fill={color}>
        {pct}%
      </text>
    </svg>
  )
}

const ROLE_ICON: Record<string, string> = { foundational: '📘', advanced: '🎓' }
const ROLE_LABEL: Record<string, string> = { foundational: 'Foundational', advanced: 'Advanced (AP)' }

// Infographic-style class-breakdown cards: one donut gauge per enrolled
// class, with a "foundational → advanced" callout when the student is
// taking Honors Chem alongside AP Chem without the usual prerequisite —
// this is the whole point of the comparison the teacher asked for.
function ClassBreakdownInfographic({ classBreakdown, isFoundationalAdvancedPairing, displayName }: {
  classBreakdown: ClassBreakdownProp[]; isFoundationalAdvancedPairing: boolean; displayName: string
}) {
  if (classBreakdown.length < 2) return null
  const sorted = [...classBreakdown].sort((a, b) => {
    if (a.role === 'foundational') return -1
    if (b.role === 'foundational') return 1
    return 0
  })

  return (
    <div className="mt-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {isFoundationalAdvancedPairing ? 'Foundational vs. Advanced' : 'Class Breakdown'}
      </p>
      {isFoundationalAdvancedPairing && (
        <p className="text-xs text-gray-400 mt-1 mb-3 max-w-xl">
          {displayName} is taking AP Chemistry while concurrently building the foundation in Honors Chemistry — a harder path than the usual sequence. A gap between the two is expected, not a red flag.
        </p>
      )}
      <div className="flex flex-wrap gap-4 mt-3">
        {sorted.map((c, i) => (
          <div key={c.classId} className="flex items-center gap-4">
            <div className="flex flex-col items-center bg-gradient-to-b from-gray-50 to-white border border-gray-100 rounded-2xl p-4 min-w-[150px]">
              <DonutGauge pct={c.overallPct} />
              <div className="mt-2 text-center">
                <p className="text-sm font-semibold text-gray-800 truncate max-w-[140px]" title={c.className}>
                  {c.role && <span className="mr-1">{ROLE_ICON[c.role]}</span>}{c.className}
                </p>
                {c.role && <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{ROLE_LABEL[c.role]}</p>}
                <p className="text-[11px] text-gray-400 mt-0.5">{c.graded} graded</p>
              </div>
            </div>
            {isFoundationalAdvancedPairing && i === 0 && sorted.length > 1 && (
              <span className="text-2xl text-gray-300">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ClassComparisonBars({ comparison, displayName }: { comparison: NonNullable<Props['classComparison']>; displayName: string }) {
  return (
    <div className="mt-4 space-y-3">
      {comparison.perTopic.map(t => (
        <div key={t.topicId}>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="truncate" title={t.title}>{t.title}</span>
            <span>{displayName}: <strong className="text-gray-700">{t.studentPct}%</strong> · Class avg: {t.classAvgPct}%</span>
          </div>
          <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${t.studentPct}%` }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-700" style={{ left: `${Math.min(100, t.classAvgPct)}%` }} title={`Class average: ${t.classAvgPct}%`} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DeepReviewPanel({
  studentId, displayName, struggleItems, initialReportText, initialGeneratedAt, hasParentEmail,
  trend, classComparison, overallPct, classBreakdown, isFoundationalAdvancedPairing,
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
        body: JSON.stringify({ studentId, items }),
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
            AI reads {displayName}&apos;s actual submitted work (not just grades) to diagnose specific misconceptions, compares progress over time, and checks against classmates.
          </p>
        </div>
      </div>

      <ClassBreakdownInfographic
        classBreakdown={classBreakdown}
        isFoundationalAdvancedPairing={isFoundationalAdvancedPairing}
        displayName={displayName}
      />

      {trend.length >= 2 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">Accuracy Trend Over Time</p>
          <TrendChart trend={trend} />
        </div>
      )}

      {classComparison && classComparison.perTopic.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-5">
            {displayName} vs. Classmates <span className="text-gray-400 normal-case font-normal">(class average {classComparison.classAvgOverallPct}% overall, {overallPct}% for {displayName}, {classComparison.classSize} classmates compared)</span>
          </p>
          <ClassComparisonBars comparison={classComparison} displayName={displayName} />
        </div>
      )}

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
