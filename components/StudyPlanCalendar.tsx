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
export default function StudyPlanCalendar({ sessions, classDays }: Props) {
  const [viewMonth, setViewMonth] = useState(() => {
    // Jump straight to the plan's first session rather than defaulting to
    // "this month" — a plan that starts 3 weeks out would otherwise open
    // on a mostly-empty calendar.
    const first = sessions[0]
    const base = first ? new Date(`${first.date}T00:00:00`) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

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

          return (
            <div key={i} className={`min-h-[64px] border-b border-r border-gray-50 p-1.5 ${isClassDay ? 'bg-purple-50/30' : ''}`}>
              <span className={`text-[11px] ${isToday ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white font-bold' : 'text-gray-400'}`}>
                {date.getDate()}
              </span>
              {session && (
                <div
                  title={session.focusTopics.join(', ')}
                  className="mt-1 text-[10px] font-medium px-1 py-0.5 rounded bg-purple-100 text-purple-700 leading-tight line-clamp-2"
                >
                  {session.focusTopics.join(', ')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
