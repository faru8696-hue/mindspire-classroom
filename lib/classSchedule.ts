// Faridah's fixed weekly group-session schedule — not tied to any DB table
// since it's a single constant shared by both classes, not something that
// currently varies per class or student. Shared between the Planning page
// and the AI weekly-plan route so they never drift apart.
export const CLASS_DAYS = ['Tuesday', 'Saturday', 'Sunday']
export const CLASS_TIME = '8:00 PM EST'

const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
}

// toISOString() converts to UTC, which shifts the date backward whenever
// the server's local timezone isn't UTC+0 — corrupting the date-to-weekday
// match even though getDay()/setDate() above are both local-time-based.
// Formatting from local components instead keeps everything consistent
// (same approach as TestDateCalendar.tsx's toIso).
function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// The next `count` calendar dates (ISO, today or later) that fall on one of
// `days` — the pool of actual upcoming session slots the AI plan can draw
// from. It doesn't have to fill every slot; this just gives it real dates
// to work with instead of bare weekday names, so a plan can legitimately
// span multiple weeks when the material calls for it.
export function nextSessionDates(days: string[], todayIso: string, count: number): string[] {
  const targetDays = new Set(days.map(d => WEEKDAY_INDEX[d]).filter(d => d !== undefined))
  const dates: string[] = []
  const cursor = new Date(`${todayIso}T00:00:00`)
  let guard = 0
  while (dates.length < count && guard < count * 20) {
    if (targetDays.has(cursor.getDay())) dates.push(toIsoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
    guard++
  }
  return dates
}
