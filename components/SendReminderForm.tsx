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
  const [studentId, setStudentId] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const studentsInClass = useMemo(() => (classId ? studentsByClass[classId] ?? [] : []), [classId, studentsByClass])

  function selectClass(id: string) {
    setClassId(id)
    setStudentId('') // changing class invalidates any specific-student pick
  }

  async function send() {
    const targetLabel = studentId
      ? studentsInClass.find(s => s.id === studentId)?.name ?? 'this student'
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
        body: JSON.stringify({ classId: classId || undefined, studentId: studentId || undefined, message }),
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
        <select
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          disabled={!classId}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:bg-gray-50"
        >
          <option value="">{classId ? 'Everyone in this class' : 'Pick a class to target one student'}</option>
          {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
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
