'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StudentNotes({ studentId }: { studentId: string }) {
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(true)
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setTeacherId(user.id)
      const { data } = await supabase
        .from('teacher_notes')
        .select('content')
        .eq('teacher_id', user.id)
        .eq('student_id', studentId)
        .maybeSingle()
      if (data) setContent(data.content ?? '')
    })
  }, [studentId])

  function handleChange(val: string) {
    setContent(val)
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(val), 1200)
  }

  async function save(val: string) {
    if (!teacherId) return
    await supabase.from('teacher_notes').upsert({
      teacher_id: teacherId,
      student_id: studentId,
      content: val,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'teacher_id,student_id' })
    setSaved(true)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-gray-800 text-sm">📝 Private Notes <span className="font-normal text-gray-400">(also used as context for the AI Deep Review)</span></h2>
        <span className={`text-xs transition-colors ${saved ? 'text-gray-300' : 'text-amber-500'}`}>
          {saved ? 'Saved' : 'Saving...'}
        </span>
      </div>
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder="Notes about this student — struggles, strengths, topics to revisit next session. Only visible to you."
        rows={6}
        className="w-full px-5 py-4 text-sm text-gray-700 resize-none focus:outline-none placeholder-gray-300"
      />
    </div>
  )
}
