// Faridah's fixed weekly group-session schedule — not tied to any DB table
// since it's just two classes with a stable pattern, not something that
// varies per student. Shared between the Planning page and the AI
// weekly-plan route so they never drift apart. Days are the same for both
// classes, but the TIME differs per class (Honors Chem 7pm, AP Chem 8pm),
// so it's keyed by class title rather than a single flat constant.
export const CLASS_DAYS = ['Tuesday', 'Saturday', 'Sunday']

const CLASS_TIME_BY_TITLE: Record<string, string> = {
  'Honors Chemistry': '7:00 PM EST',
  'AP Chemistry': '8:00 PM EST',
}
const DEFAULT_CLASS_TIME = '8:00 PM EST'

export function classTimeFor(classTitle: string): string {
  return CLASS_TIME_BY_TITLE[classTitle] ?? DEFAULT_CLASS_TIME
}

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

// Human-readable date+day label for a manually added/edited plan session
// (the AI normally writes its own dayLabel; this covers the teacher-edit
// path where there's no AI call to ask for one).
export function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
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
