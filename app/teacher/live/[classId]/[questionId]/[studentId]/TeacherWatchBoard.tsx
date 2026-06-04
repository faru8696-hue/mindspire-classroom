'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import InfiniteWhiteboard from '@/components/InfiniteWhiteboard'

interface Props {
  questionId: string
  studentId: string
  submissionId: string | null
  initialStudentData: string | null
  imageUrl: string | null
  initialGrade: string | null
  initialFeedbackText: string | null
}

const GRADES = [
  { value: 'correct',   label: '✓ Correct',      cls: 'bg-green-600 hover:bg-green-500 text-white',   activeCls: 'ring-4 ring-green-400' },
  { value: 'partial',   label: '~ Partial',       cls: 'bg-amber-500 hover:bg-amber-400 text-white',   activeCls: 'ring-4 ring-amber-300' },
  { value: 'discussed', label: '💬 Discussed',    cls: 'bg-blue-600 hover:bg-blue-500 text-white',     activeCls: 'ring-4 ring-blue-400' },
  { value: 'incorrect', label: '✗ Wrong',         cls: 'bg-red-600 hover:bg-red-500 text-white',       activeCls: 'ring-4 ring-red-400' },
  { value: 'needsmore', label: '🔄 Needs More',   cls: 'bg-purple-600 hover:bg-purple-500 text-white', activeCls: 'ring-4 ring-purple-400' },
]

export default function TeacherWatchBoard({
  questionId, studentId, submissionId,
  initialStudentData, imageUrl,
  initialGrade, initialFeedbackText,
}: Props) {
  const supabase = createClient()
  const [grade, setGrade] = useState<string | null>(initialGrade)
  const [feedbackText, setFeedbackText] = useState(initialFeedbackText ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showImage, setShowImage] = useState(false)

  async function saveTeacher(dataUrl: string) {
    if (!submissionId) return
    await supabase.from('feedback').upsert(
      { submission_id: submissionId, canvas_data: dataUrl },
      { onConflict: 'submission_id' }
    )
  }

  async function applyGrade(g: string) {
    const newGrade = grade === g ? null : g  // toggle off if same
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
      { submission_id: submissionId, grade: grade, text_feedback: feedbackText || null },
      { onConflict: 'submission_id' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Whiteboard — fills space */}
      <div className="flex-1 min-h-0 relative">
        <InfiniteWhiteboard
          questionId={questionId}
          studentId={studentId}
          role="teacher"
          initialStudentData={initialStudentData}
          initialTeacherData={null}
          onSaveTeacher={saveTeacher}
        />

        {/* Image upload preview button */}
        {imageUrl && (
          <button
            onClick={() => setShowImage(v => !v)}
            className="absolute top-3 right-3 z-10 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-lg"
          >
            🖼 View Uploaded Image
          </button>
        )}

        {/* Image overlay */}
        {showImage && imageUrl && (
          <div
            className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center p-6"
            onClick={() => setShowImage(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Student uploaded"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImage(false)}
              className="absolute top-4 right-4 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70"
            >×</button>
          </div>
        )}
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
    </div>
  )
}
