'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  initialFullName: string
  initialNickname: string
  initialAvatarUrl: string | null
}

export default function ProfileEditor({ userId, initialFullName, initialNickname, initialAvatarUrl }: Props) {
  const supabase = createClient()
  const [fullName, setFullName] = useState(initialFullName)
  const [nickname, setNickname] = useState(initialNickname)
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
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('profiles').update({
      full_name: fullName,
      nickname: nickname || null,
    }).eq('id', userId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const initials = (fullName || nickname || '?').charAt(0).toUpperCase()

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-200 hover:border-purple-400 transition-colors focus:outline-none group"
          title="Click to change avatar"
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <p className="text-xs text-gray-400">Click avatar to upload a new photo</p>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nickname <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="What should we call you?"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">Phone and grade info managed by your teacher.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'} disabled:opacity-60`}
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
