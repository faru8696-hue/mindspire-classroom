import Link from 'next/link'
import { getDayReport, getWeekReport, type QuestionActivity } from '@/lib/studyTracker'

export const dynamic = 'force-dynamic'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
function formatDayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function formatShort(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
function formatTimeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// `estimatedMinutes` is only ever set when a question's first save and last
// save happened on the same calendar day within a 3-hour window — anything
// else (picked back up on a later day, or left open for hours) has no
// honest duration to show, so this labels those cases plainly instead of
// making up a number. See lib/studyTracker.ts for the full reasoning.
function timeLabel(q: QuestionActivity): string {
  if (q.estimatedMinutes !== null) return `~${q.estimatedMinutes} min · saved ${formatTimeOfDay(q.updatedAt)}`
  if (q.continuedFromEarlier) return `continued from an earlier day · saved ${formatTimeOfDay(q.updatedAt)}`
  return `long session (3h+) · saved ${formatTimeOfDay(q.updatedAt)}`
}

const GRADE_CLS: Record<string, string> = {
  correct: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  incorrect: 'bg-red-100 text-red-600',
}

export default async function StudyTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; date?: string }>
}) {
  const { mode: modeParam, date: dateParam } = await searchParams
  const mode = modeParam === 'week' ? 'week' : 'day'
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayISO()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-purple-900">Study Tracker</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <Link
            href={`?mode=day&date=${date}`}
            className={`text-sm font-semibold px-3 py-1 rounded-md transition-colors ${mode === 'day' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Day
          </Link>
          <Link
            href={`?mode=week&date=${date}`}
            className={`text-sm font-semibold px-3 py-1 rounded-md transition-colors ${mode === 'week' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Week
          </Link>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">Who&rsquo;s been working through questions, on what topics, and roughly how long — from the class content system (not Self Study or Tests).</p>

      {mode === 'day' ? <DayView date={date} /> : <WeekView date={date} />}
    </div>
  )
}

async function DayView({ date }: { date: string }) {
  const report = await getDayReport(date)
  const isToday = date === todayISO()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
        <Link href={`?mode=day&date=${addDays(date, -1)}`} className="text-sm font-semibold text-purple-600 hover:underline">← {formatShort(addDays(date, -1))}</Link>
        <div className="text-center">
          <p className="font-bold text-gray-800">{formatDayLabel(date)}</p>
          {!isToday && <Link href={`?mode=day&date=${todayISO()}`} className="text-xs text-purple-600 hover:underline">Jump to today</Link>}
        </div>
        <Link href={`?mode=day&date=${addDays(date, 1)}`} className="text-sm font-semibold text-purple-600 hover:underline">{formatShort(addDays(date, 1))} →</Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-indigo-600">{report.totalStudentsActive}<span className="text-sm text-gray-400 font-normal">/{report.students.length}</span></div>
          <div className="text-xs text-gray-500 font-medium">Students active</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-green-600">{report.totalQuestionsAnswered}</div>
          <div className="text-xs text-gray-500 font-medium">Questions answered</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-blue-600">{report.topicCounts.length}</div>
          <div className="text-xs text-gray-500 font-medium">Topics touched</div>
        </div>
      </div>

      {report.topicCounts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-2">Topics studied</h2>
          <div className="flex flex-wrap gap-2">
            {report.topicCounts.map(t => (
              <span key={`${t.unitTitle}:${t.topicTitle}`} className="text-xs font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                {t.topicTitle} <span className="text-purple-400">×{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {report.students.map(({ student, questions, totalMinutes }) => (
          <div key={student.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-400">{student.classTitle}</p>
                </div>
              </div>
              {questions.length > 0 ? (
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  {questions.length} question{questions.length === 1 ? '' : 's'}{totalMinutes > 0 ? ` · ~${totalMinutes} min` : ''}
                </span>
              ) : (
                <span className="text-xs text-gray-300">No activity</span>
              )}
            </div>
            {questions.length > 0 && (
              <div className="mt-2 ml-9 space-y-1">
                {questions.map(q => (
                  <div key={q.questionId} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate">
                      {q.questionTitle} <span className="text-gray-400">· {q.topicTitle}</span>
                    </span>
                    <span className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      {q.grade && <span className={`font-bold px-1.5 py-0.5 rounded-full ${GRADE_CLS[q.grade] ?? 'bg-gray-100 text-gray-500'}`}>{q.grade}</span>}
                      <span className="text-gray-400">{timeLabel(q)}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

async function WeekView({ date }: { date: string }) {
  const report = await getWeekReport(date)
  const thisWeekStart = mondayISOOf(todayISO())
  const isThisWeek = report.weekStartISO === thisWeekStart

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
        <Link href={`?mode=week&date=${addDays(report.weekStartISO, -7)}`} className="text-sm font-semibold text-purple-600 hover:underline">← Prev week</Link>
        <div className="text-center">
          <p className="font-bold text-gray-800">Week of {formatShort(report.weekStartISO)} – {formatShort(report.weekEndISO)}</p>
          {!isThisWeek && <Link href={`?mode=week&date=${todayISO()}`} className="text-xs text-purple-600 hover:underline">Jump to this week</Link>}
        </div>
        <Link href={`?mode=week&date=${addDays(report.weekStartISO, 7)}`} className="text-sm font-semibold text-purple-600 hover:underline">Next week →</Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-indigo-600">{report.totalStudentsActive}<span className="text-sm text-gray-400 font-normal">/{report.students.length}</span></div>
          <div className="text-xs text-gray-500 font-medium">Students studied</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-green-600">{report.totalQuestionsAnswered}</div>
          <div className="text-xs text-gray-500 font-medium">Questions answered</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-black text-blue-600">{report.topicCounts.length}</div>
          <div className="text-xs text-gray-500 font-medium">Topics touched</div>
        </div>
      </div>

      {report.topicCounts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-2">Topics studied this week</h2>
          <div className="flex flex-wrap gap-2">
            {report.topicCounts.map(t => (
              <span key={`${t.unitTitle}:${t.topicTitle}`} className="text-xs font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                {t.topicTitle} <span className="text-purple-400">×{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {report.students.map(({ student, totalQuestions, activeDays, dayCounts, topicsTouched }) => (
          <div key={student.id} className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-400">{student.classTitle}</p>
                </div>
              </div>
              {totalQuestions > 0 ? (
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  {totalQuestions} question{totalQuestions === 1 ? '' : 's'} · {activeDays.length}/7 days
                </span>
              ) : (
                <span className="text-xs text-gray-300">No activity</span>
              )}
            </div>
            <div className="ml-9 flex items-center gap-1.5 mb-1.5">
              {dayCounts.map((count, i) => (
                <div
                  key={i}
                  title={`${WEEKDAY_LETTERS[i]}: ${count} question${count === 1 ? '' : 's'}`}
                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                    count === 0 ? 'bg-gray-100 text-gray-300' : count < 3 ? 'bg-purple-200 text-purple-700' : 'bg-purple-500 text-white'
                  }`}
                >
                  {count > 0 ? count : WEEKDAY_LETTERS[i]}
                </div>
              ))}
            </div>
            {topicsTouched.length > 0 && (
              <p className="ml-9 text-xs text-gray-400 truncate">
                {topicsTouched.map(t => t.topicTitle).join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function mondayISOOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}
