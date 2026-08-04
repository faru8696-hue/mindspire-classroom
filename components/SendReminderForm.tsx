'use client'

import { useState, useMemo } from 'react'

interface ClassOption { id: string; title: string }
interface StudentOption { id: string; name: string }

export default function SendReminderForm({
  classes, studentsByClass,
}: {
  classes: ClassOption[]
  studentsByClass: Record<string, StudentOption[]>
}) {
  const [classId, setClassId] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const studentsInClass = useMemo(() => (classId ? studentsByClass[classId] ?? [] : []), [classId, studentsByClass])

  function selectClass(id: string) {
    setClassId(id)
    setSelectedIds([]) // changing class invalidates any specific-student picks
  }

  function toggleStudent(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const pickerLabel = !classId
    ? 'All classes — every student'
    : selectedIds.length === 0
    ? 'Everyone in this class'
    : selectedIds.length === 1
    ? studentsInClass.find(s => s.id === selectedIds[0])?.name ?? '1 student'
    : `${selectedIds.length} students selected`

  async function send() {
    const targetLabel = selectedIds.length > 0
      ? selectedIds.length === 1
        ? studentsInClass.find(s => s.id === selectedIds[0])?.name ?? 'this student'
        : `${selectedIds.length} students`
      : classId
      ? `everyone in ${classes.find(c => c.id === classId)?.title ?? 'this class'}`
      : 'every student in every class'
    if (!window.confirm(`Send this reminder to ${targetLabel}?\n\n"${message.trim()}"`)) return

    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/teacher/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: classId || undefined, studentIds: selectedIds.length > 0 ? selectedIds : undefined, message }),
      })
      const data = await res.json()
      if (!res.ok) { setResult({ ok: false, text: data.error || 'Something went wrong.' }); return }
      setResult({ ok: true, text: `Sent to ${data.sentCount} student${data.sentCount === 1 ? '' : 's'}.` })
      setMessage('')
    } catch {
      setResult({ ok: false, text: 'Connection error.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={classId}
          onChange={e => selectClass(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>

        {/* Custom multi-select — a native <select multiple> needs ctrl/cmd-click
            to pick more than one, which isn't discoverable. This is checkboxes
            in a dropdown instead: click a name to toggle it, leave everything
            unchecked to mean "everyone in this class." */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen(o => !o)}
            disabled={!classId}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:bg-gray-50 bg-white text-left min-w-[180px] flex items-center justify-between gap-2"
          >
            <span className="truncate">{pickerLabel}</span>
            <span className="text-gray-400 flex-shrink-0">▾</span>
          </button>
          {pickerOpen && classId && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
              <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 font-medium"
                >
                  <span className="w-4 flex-shrink-0">{selectedIds.length === 0 ? '✓' : ''}</span>
                  Everyone in this class
                </button>
                <div className="max-h-56 overflow-y-auto">
                  {studentsInClass.map(s => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleStudent(s.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${selectedIds.includes(s.id) ? 'bg-purple-50 text-purple-700' : ''}`}
                    >
                      <span className="w-4 flex-shrink-0">{selectedIds.includes(s.id) ? '✓' : ''}</span>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="e.g. Don't forget to study for Friday's test!"
        rows={2}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={send}
          disabled={sending || !message.trim()}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
        >
          {sending ? 'Sending…' : '📣 Send Reminder'}
        </button>
        {result && (
          <p className={`text-xs ${result.ok ? 'text-green-600' : 'text-red-600'}`}>{result.text}</p>
        )}
      </div>
    </div>
  )
}
