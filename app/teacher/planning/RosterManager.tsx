'use client'

import { useState } from 'react'

export interface RosterStudent {
  id: string
  name: string
  inGroup: boolean
}

export default function RosterManager({ classId, students }: { classId: string; students: RosterStudent[] }) {
  const [open, setOpen] = useState(false)
  const [roster, setRoster] = useState(students)
  const [savingId, setSavingId] = useState<string | null>(null)

  const excludedCount = roster.filter(s => !s.inGroup).length

  async function toggle(studentId: string) {
    const current = roster.find(s => s.id === studentId)
    if (!current) return
    const nextInGroup = !current.inGroup
    setSavingId(studentId)
    const res = await fetch('/api/set-group-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, classId, inGroup: nextInGroup }),
    })
    setSavingId(null)
    if (res.ok) {
      setRoster(prev => prev.map(s => s.id === studentId ? { ...s, inGroup: nextInGroup } : s))
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">
          👥 Manage roster
          {excludedCount > 0 && <span className="text-xs font-normal text-gray-400 ml-2">({excludedCount} excluded from planning)</span>}
        </span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {roster.map(s => (
            <div key={s.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className={s.inGroup ? 'text-gray-700' : 'text-gray-400'}>{s.name}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">Group student</span>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  disabled={savingId === s.id}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${s.inGroup ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.inGroup ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
          ))}
          {roster.length === 0 && <p className="text-sm text-gray-400 px-4 py-3">No students enrolled.</p>}
        </div>
      )}
    </div>
  )
}
