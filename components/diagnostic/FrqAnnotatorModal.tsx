'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ScratchBoard, { type ScratchBoardHandle } from '../ScratchBoard'

// Reuses ScratchBoard as an annotation surface: loaded with the student's
// current work (their original submission, or a prior annotation pass) as
// the background image, the teacher draws on top, and the flattened
// composite is saved as teacher_annotation — canvas_data (the student's
// original) is never touched, so re-annotating always has the option to
// start over from what the student actually submitted.
export default function FrqAnnotatorModal({
  attemptId, questionId, startingImage, onClose,
}: {
  attemptId: string
  questionId: string
  startingImage: string
  onClose: () => void
}) {
  const router = useRouter()
  const boardRef = useRef<ScratchBoardHandle>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    const snapshot = boardRef.current?.getSnapshot()
    if (!snapshot) { onClose(); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/diagnostic/admin/annotate-frq-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, questionId, annotationDataUrl: snapshot }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSaving(false); return }
      router.refresh()
      onClose()
    } catch {
      setError('Connection error.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !saving && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Annotate Student&rsquo;s Work</h3>
          <span className="text-xs text-gray-400">Draw circles, checkmarks, or notes directly on their work</span>
        </div>
        <ScratchBoard ref={boardRef} initialDataUrl={startingImage} label="✏️ Draw your feedback" penColor="#dc2626" />
        {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Annotation'}
          </button>
          <button onClick={onClose} disabled={saving}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
