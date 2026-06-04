'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import InfiniteWhiteboard from '@/components/InfiniteWhiteboard'

interface Props {
  questionId: string
  studentId: string
  submissionId: string | null
  initialStudentData: string | null
  initialGrade: string | null
  initialFeedbackText: string | null
}

const GRADES = [
  { value: 'correct',   label: '✓ Correct',    cls: 'bg-green-600 hover:bg-green-500 text-white',   activeCls: 'ring-4 ring-green-400' },
  { value: 'partial',   label: '~ Partial',     cls: 'bg-amber-500 hover:bg-amber-400 text-white',   activeCls: 'ring-4 ring-amber-300' },
  { value: 'discussed', label: '💬 Discussed',  cls: 'bg-blue-600 hover:bg-blue-500 text-white',     activeCls: 'ring-4 ring-blue-400' },
  { value: 'incorrect', label: '✗ Wrong',       cls: 'bg-red-600 hover:bg-red-500 text-white',       activeCls: 'ring-4 ring-red-400' },
  { value: 'needsmore', label: '🔄 Needs More', cls: 'bg-purple-600 hover:bg-purple-500 text-white', activeCls: 'ring-4 ring-purple-400' },
]

// Extract image URLs from canvas JSON (objects with type='image' and a non-empty data URL)
function extractImages(canvasJson: string | null): string[] {
  if (!canvasJson) return []
  try {
    const objs = JSON.parse(canvasJson) as { type: string; data?: string }[]
    return objs
      .filter(o => o.type === 'image' && o.data && !o.data.startsWith('data:'))
      .map(o => o.data as string)
  } catch { return [] }
}

export default function TeacherWatchBoard({
  questionId, studentId, submissionId,
  initialStudentData,
  initialGrade, initialFeedbackText,
}: Props) {
  const supabase = createClient()
  const [grade, setGrade] = useState<string | null>(initialGrade)
  const [feedbackText, setFeedbackText] = useState(initialFeedbackText ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [studentData, setStudentData] = useState(initialStudentData)
  const [boardKey, setBoardKey] = useState(0)

  // Extract image URLs from canvas JSON — updates whenever studentData changes
  const uploadedImages = useMemo(() => extractImages(studentData), [studentData])

  // Subscribe to student submission updates via realtime
  useEffect(() => {
    if (!submissionId) return
    const ch = supabase.channel(`watch-sub:${submissionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'submissions',
        filter: `id=eq.${submissionId}`,
      }, payload => {
        const row = payload.new as { canvas_data: string | null }
        if (row.canvas_data && row.canvas_data !== studentData) {
          setStudentData(row.canvas_data)
          setBoardKey(k => k + 1)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [submissionId])

  async function saveTeacher(dataUrl: string) {
    if (!submissionId) return
    await supabase.from('feedback').upsert(
      { submission_id: submissionId, canvas_data: dataUrl },
      { onConflict: 'submission_id' }
    )
  }

  async function applyGrade(g: string) {
    const newGrade = grade === g ? null : g
    setGrade(newGrade)
    if (!submissionId) return
    setSaving(true)
    await supabase.from('feedback').upsert(
      { submission_id: submissionId, grade: newGrade, text_feedback: feedbackText || null },
      { onConflict: 'submission_id' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function saveFeedback() {
    if (!submissionId) return
    setSaving(true)
    await supabase.from('feedback').upsert(
      { submission_id: submissionId, grade, text_feedback: feedbackText || null },
      { onConflict: 'submission_id' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Uploaded images strip — shown directly, no button needed */}
      {uploadedImages.length > 0 && (
        <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center gap-3 overflow-x-auto flex-shrink-0">
          <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">Uploaded:</span>
          {uploadedImages.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Student upload ${i + 1}`}
              className="h-24 w-auto rounded-lg cursor-pointer border border-gray-600 hover:border-blue-400 transition-colors object-contain bg-white"
              onClick={() => setLightbox(url)}
            />
          ))}
          <span className="text-xs text-gray-500 whitespace-nowrap">Click to enlarge</span>
        </div>
      )}

      {/* Whiteboard */}
      <div className="flex-1 min-h-0">
        <InfiniteWhiteboard
          key={boardKey}
          questionId={questionId}
          studentId={studentId}
          role="teacher"
          initialStudentData={studentData}
          initialTeacherData={null}
          onSaveTeacher={saveTeacher}
        />
      </div>

      {/* Grading bar */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-semibold mr-1">Grade:</span>
          {GRADES.map(g => (
            <button
              key={g.value}
              onClick={() => applyGrade(g.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${g.cls} ${grade === g.value ? g.activeCls : 'opacity-70'}`}
            >
              {g.label}
            </button>
          ))}
          <div className="flex-1 min-w-[160px] flex items-center gap-2 ml-2">
            <input
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveFeedback()}
              placeholder="Add feedback note..."
              className="flex-1 bg-gray-800 border border-gray-600 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-500"
            />
            <button
              onClick={saveFeedback}
              disabled={saving}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            >
              {saved ? '✓ Saved' : saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Student upload" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center">×</button>
        </div>
      )}
    </div>
  )
}
