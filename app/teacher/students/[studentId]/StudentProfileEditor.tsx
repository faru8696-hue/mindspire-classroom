'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface StudentProfileFields {
  fullName: string
  nickname: string
  email: string
  gradeLevel: string
  phone: string
  parentName: string
  parentPhone: string
  parentEmail: string
}

const FIELD_LABELS: { key: keyof StudentProfileFields; label: string; type: string }[] = [
  { key: 'fullName', label: 'Name', type: 'text' },
  { key: 'nickname', label: 'Nickname', type: 'text' },
  { key: 'email', label: 'Student Email', type: 'email' },
  { key: 'gradeLevel', label: 'Grade Level', type: 'text' },
  { key: 'phone', label: 'Student Phone', type: 'tel' },
  { key: 'parentName', label: 'Parent / Guardian', type: 'text' },
  { key: 'parentPhone', label: 'Parent Phone', type: 'tel' },
  { key: 'parentEmail', label: 'Parent Email', type: 'email' },
]

// Owns both the read-only profile card AND its edit form (matches the
// toggle pattern used by TestTimingEditor) — a teacher clicks "Edit info",
// the card swaps to a form for every editable field, including the
// parent's contact details, then swaps back on save.
export default function StudentProfileEditor({
  studentId, avatarUrl, enrolledClassNames, initial,
}: {
  studentId: string
  avatarUrl: string | null
  enrolledClassNames: string[]
  initial: StudentProfileFields
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set<K extends keyof StudentProfileFields>(key: K, value: string) {
    setDraft(d => ({ ...d, [key]: value }))
  }

  async function save() {
    if (!draft.fullName.trim()) { setError('Name is required.'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/teacher/students/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          fullName: draft.fullName.trim(),
          nickname: draft.nickname.trim(),
          email: draft.email.trim(),
          gradeLevel: draft.gradeLevel.trim(),
          phone: draft.phone.trim(),
          parentName: draft.parentName.trim(),
          parentPhone: draft.parentPhone.trim(),
          parentEmail: draft.parentEmail.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSaving(false); return }
      setSaving(false)
      setEditing(false)
      router.refresh()
    } catch {
      setError('Connection error.')
      setSaving(false)
    }
  }

  function cancel() {
    setDraft(initial)
    setError('')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-purple-300 p-6">
        <div className="grid grid-cols-2 gap-3">
          {FIELD_LABELS.map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input
                type={type}
                value={draft[key]}
                onChange={e => set(key, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}
        </div>
        {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg mt-3">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button onClick={save} disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={cancel} disabled={saving}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-1.5 rounded-lg transition disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-start gap-5">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 flex-shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-600 flex-shrink-0">
          {(initial.nickname || initial.fullName || '?').charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-8 gap-y-1.5">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Name</p>
          <p className="text-sm font-semibold text-gray-900">{initial.fullName}</p>
        </div>
        {initial.nickname && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Nickname</p>
            <p className="text-sm text-gray-700">{initial.nickname}</p>
          </div>
        )}
        {initial.email && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
            <p className="text-sm text-gray-700">{initial.email}</p>
          </div>
        )}
        {initial.gradeLevel && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Grade Level</p>
            <p className="text-sm text-gray-700">{initial.gradeLevel}</p>
          </div>
        )}
        {initial.phone && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Student Phone</p>
            <p className="text-sm text-gray-700">{initial.phone}</p>
          </div>
        )}
        {initial.parentName && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Parent / Guardian</p>
            <p className="text-sm text-gray-700">{initial.parentName}</p>
          </div>
        )}
        {initial.parentPhone && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Parent Phone</p>
            <p className="text-sm text-gray-700">{initial.parentPhone}</p>
          </div>
        )}
        {initial.parentEmail && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Parent Email</p>
            <p className="text-sm text-gray-700">{initial.parentEmail}</p>
          </div>
        )}
        {enrolledClassNames.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Class{enrolledClassNames.length > 1 ? 'es' : ''}</p>
            <p className="text-sm text-gray-700">{enrolledClassNames.join(', ')}</p>
          </div>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex-shrink-0"
      >
        ✏️ Edit info
      </button>
    </div>
  )
}
