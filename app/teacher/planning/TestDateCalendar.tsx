'use client'

import { useState } from 'react'

export interface CalendarEvent {
  date: string // YYYY-MM-DD
  classId: string
  classTitle: string
  topicTitle: string
  count: number
}

interface Props {
  events: CalendarEvent[]
  classDays: string[] // e.g. ['Tuesday', 'Saturday', 'Sunday']
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
// Cycled by a class's position among the classes present in `events` —
// extensible if a third class is ever added.
const CLASS_COLORS = ['bg-purple-100 text-purple-700', 'bg-teal-100 text-teal-700', 'bg-amber-100 text-amber-700']

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TestDateCalendar({ events, classDays }: Props) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const classIds = [...new Set(events.map(e => e.classId))]
  const colorByClass = new Map(classIds.map((id, i) => [id, CLASS_COLORS[i % CLASS_COLORS.length]]))

  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    if (!eventsByDate.has(e.date)) eventsByDate.set(e.date, [])
    eventsByDate.get(e.date)!.push(e)
  }

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay() // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayIso = toIso(new Date())

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const classDayIndexes = new Set(classDays.map(d => WEEKDAY_LABELS.findIndex(w => w.toLowerCase() === d.slice(0, 3).toLowerCase())))

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="text-gray-500 hover:text-purple-700 px-2 py-1 rounded"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-700">{MONTH_LABELS[month]} {year}</span>
        <button
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="text-gray-500 hover:text-purple-700 px-2 py-1 rounded"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-[11px] font-semibold uppercase tracking-wide py-2 ${classDayIndexes.has(i) ? 'text-purple-700 bg-purple-50/60' : 'text-gray-400'}`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-[76px] border-b border-r border-gray-50 bg-gray-50/30" />
          const iso = toIso(date)
          const dayEvents = eventsByDate.get(iso) ?? []
          const isClassDay = classDayIndexes.has(date.getDay())
          const isToday = iso === todayIso
          const visible = dayEvents.slice(0, 2)
          const overflow = dayEvents.length - visible.length

          return (
            <div
              key={i}
              className={`min-h-[76px] border-b border-r border-gray-50 p-1.5 ${isClassDay ? 'bg-purple-50/30' : ''}`}
            >
              <span className={`text-[11px] ${isToday ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white font-bold' : 'text-gray-400'}`}>
                {date.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {visible.map((e, j) => (
                  <div
                    key={j}
                    title={`${e.classTitle}: ${e.topicTitle} (${e.count} student${e.count === 1 ? '' : 's'})`}
                    className={`text-[10px] font-medium px-1 py-0.5 rounded truncate ${colorByClass.get(e.classId) ?? CLASS_COLORS[0]}`}
                  >
                    {e.topicTitle} · {e.count}
                  </div>
                ))}
                {overflow > 0 && <div className="text-[10px] text-gray-400 px-1">+{overflow} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
