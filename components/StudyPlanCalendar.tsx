'use client'

import { useState } from 'react'

export interface StudyPlanCalendarSession {
  date: string // YYYY-MM-DD
  dayLabel: string
  focusTopics: string[]
}

interface Props {
  sessions: StudyPlanCalendarSession[]
  classDays: string[] // e.g. ['Tuesday', 'Saturday', 'Sunday']
  editable?: boolean
  onSaveSession?: (date: string, focusTopics: string[]) => void | Promise<void>
  onDeleteSession?: (date: string) => void | Promise<void>
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Same visual grid as app/teacher/planning/TestDateCalendar.tsx (kept as a
// separate component since a plan session's shape — one date, a list of
// topics — is different enough from a test-date event that a shared prop
// interface would just add indirection). Purely an at-a-glance overview of
// WHEN things happen; the full rationale/homework text stays in the
// existing list below this calendar wherever it's rendered.
//
// Cells never truncate their text — a row grows to fit whatever's in it
// (a previous version line-clamped to 2 lines, which cut off real plan
// content). When editable, clicking any day opens an inline editor to add,
// rewrite, or remove that date's topics.
export default function StudyPlanCalendar({ sessions, classDays, editable, onSaveSession, onDeleteSession }: Props) {
  const [viewMonth, setViewMonth] = useState(() => {
    // Jump straight to the plan's first session rather than defaulting to
    // "this month" — a plan that starts 3 weeks out would otherwise open
    // on a mostly-empty calendar.
    const first = sessions[0]
    const base = first ? new Date(`${first.date}T00:00:00`) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [saving, setSaving] = useState(false)

  const sessionByDate = new Map(sessions.map(s => [s.date, s]))

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayIso = toIso(new Date())

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const classDayIndexes = new Set(classDays.map(d => WEEKDAY_LABELS.findIndex(w => w.toLowerCase() === d.slice(0, 3).toLowerCase())))

  function startEditing(iso: string) {
    if (!editable) return
    setEditingDate(iso)
    setDraftText(sessionByDate.get(iso)?.focusTopics.join(', ') ?? '')
  }

  async function saveEditing() {
    if (!editingDate) return
    const topics = draftText.split(',').map(t => t.trim()).filter(Boolean)
    if (topics.length === 0) return
    setSaving(true)
    await onSaveSession?.(editingDate, topics)
    setSaving(false)
    setEditingDate(null)
  }

  async function deleteEditing() {
    if (!editingDate) return
    setSaving(true)
    await onDeleteSession?.(editingDate)
    setSaving(false)
    setEditingDate(null)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <button onClick={() => setViewMonth(new Date(year, month - 1, 1))} className="text-gray-500 hover:text-purple-700 px-2 py-1 rounded">‹</button>
        <span className="text-sm font-semibold text-gray-700">{MONTH_LABELS[month]} {year}</span>
        <button onClick={() => setViewMonth(new Date(year, month + 1, 1))} className="text-gray-500 hover:text-purple-700 px-2 py-1 rounded">›</button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={w} className={`text-center text-[11px] font-semibold uppercase tracking-wide py-2 ${classDayIndexes.has(i) ? 'text-purple-700 bg-purple-50/60' : 'text-gray-400'}`}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-[64px] border-b border-r border-gray-50 bg-gray-50/30" />
          const iso = toIso(date)
          const session = sessionByDate.get(iso)
          const isClassDay = classDayIndexes.has(date.getDay())
          const isToday = iso === todayIso
          const isEditing = editingDate === iso

          return (
            <div
              key={i}
              onClick={() => !isEditing && startEditing(iso)}
              className={`min-h-[64px] border-b border-r border-gray-50 p-1.5 ${isClassDay ? 'bg-purple-50/30' : ''} ${editable && !isEditing ? 'cursor-pointer hover:bg-purple-50/60' : ''}`}
            >
              <span className={`text-[11px] ${isToday ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white font-bold' : 'text-gray-400'}`}>
                {date.getDate()}
              </span>

              {isEditing ? (
                <div className="mt-1 space-y-1" onClick={e => e.stopPropagation()}>
                  <textarea
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    placeholder="Topic, another topic…"
                    rows={2}
                    className="w-full text-[11px] border border-purple-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <button onClick={saveEditing} disabled={saving} className="text-[10px] font-semibold bg-purple-600 hover:bg-purple-700 text-white px-1.5 py-0.5 rounded disabled:opacity-50">
                      Save
                    </button>
                    {session && (
                      <button onClick={deleteEditing} disabled={saving} className="text-[10px] font-semibold text-red-500 hover:text-red-700 px-1 disabled:opacity-50">
                        Delete
                      </button>
                    )}
                    <button onClick={() => setEditingDate(null)} className="text-[10px] text-gray-400 hover:text-gray-600 px-1">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : session ? (
                <div className="mt-1 text-[10px] font-medium px-1 py-0.5 rounded bg-purple-100 text-purple-700 leading-snug whitespace-pre-wrap">
                  {session.focusTopics.join(', ')}
                </div>
              ) : (
                editable && <div className="mt-1 text-[10px] text-gray-300">+ Add</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
