'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  email: string
  initialFullName: string
  initialNickname: string
  initialAvatarUrl: string | null
  initialGradeLevel: string
  initialPhone: string
  initialParentName: string
  initialParentPhone: string
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
      />
    </div>
  )
}

export default function ProfileEditor({
  userId, email,
  initialFullName, initialNickname, initialAvatarUrl,
  initialGradeLevel, initialPhone, initialParentName, initialParentPhone,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const required = searchParams.get('required') === '1'
  const [fullName, setFullName] = useState(initialFullName)
  const [nickname, setNickname] = useState(initialNickname)
  const [gradeLevel, setGradeLevel] = useState(initialGradeLevel)
  const [phone, setPhone] = useState(initialPhone)
  const [parentName, setParentName] = useState(initialParentName)
  const [parentPhone, setParentPhone] = useState(initialParentPhone)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { setError(uploadError.message); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl + '?t=' + Date.now()
    setAvatarUrl(url)
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId)
  }

  async function handleSave() {
    if (required && (!gradeLevel || !phone || !parentName || !parentPhone)) {
      setError('Please fill in all required fields: grade level, phone, parent name, and parent phone.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('profiles').update({
      full_name: fullName,
      nickname: nickname || null,
      grade_level: gradeLevel || null,
      phone: phone || null,
      parent_name: parentName || null,
      parent_phone: parentPhone || null,
    }).eq('id', userId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    if (required) {
      setTimeout(() => router.replace('/student'), 1000)
    } else {
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const initials = (nickname || fullName || '?').charAt(0).toUpperCase()

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-200 hover:border-purple-400 transition-colors focus:outline-none group"
          title="Click to change photo"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-purple-100 flex items-center justify-center text-3xl font-bold text-purple-600">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-semibold">Change</span>
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <p className="text-xs text-gray-400">Click to upload a photo</p>
      </div>

      {/* Read-only email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">{email}</div>
      </div>

      {/* Section: Your info */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Info</p>
        <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Your full name" />
        <Field label="Nickname" value={nickname} onChange={setNickname} placeholder="What should we call you?" />
        <Field label={`Grade Level${required ? ' *' : ''}`} value={gradeLevel} onChange={setGradeLevel} placeholder="e.g. 10th grade, Junior…" />
        <Field label={`Phone Number${required ? ' *' : ''}`} value={phone} onChange={setPhone} type="tel" placeholder="Your phone number" />
      </div>

      {/* Section: Parent/Guardian */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parent / Guardian</p>
        <Field label={`Parent / Guardian Name${required ? ' *' : ''}`} value={parentName} onChange={setParentName} placeholder="Full name" />
        <Field label={`Parent / Guardian Phone${required ? ' *' : ''}`} value={parentPhone} onChange={setParentPhone} type="tel" placeholder="Phone number" />
      </div>

      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        🔒 Your phone, parent info, and grade level are only visible to your teacher — not to other students.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'} disabled:opacity-60`}
      >
        {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
