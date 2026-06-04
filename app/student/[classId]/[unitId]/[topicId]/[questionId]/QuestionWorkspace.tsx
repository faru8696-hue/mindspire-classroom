'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import DrawingCanvas, { DrawingCanvasHandle } from '@/components/DrawingCanvas'

interface Props {
  questionId: string
  userId: string
  classId: string
  submissionId: string | null
  initialSubmission: { canvas_data: string | null; text_answer: string | null; image_url: string | null } | null
  feedback: { text_feedback: string | null; canvas_data: string | null } | null
}

type Tab = 'draw' | 'type'

const CHEM_CHARS = [
  { label: '→', val: '→' }, { label: '⇌', val: '⇌' }, { label: '↑', val: '↑' }, { label: '↓', val: '↓' },
  { label: 'Δ', val: 'Δ' }, { label: '°C', val: '°C' }, { label: '±', val: '±' }, { label: '×', val: '×' },
  { label: 'α', val: 'α' }, { label: 'β', val: 'β' }, { label: 'γ', val: 'γ' }, { label: 'λ', val: 'λ' },
  { label: 'μ', val: 'μ' }, { label: 'π', val: 'π' }, { label: '∞', val: '∞' }, { label: '√', val: '√' },
  { label: '₀', val: '₀' }, { label: '₁', val: '₁' }, { label: '₂', val: '₂' }, { label: '₃', val: '₃' },
  { label: '₄', val: '₄' }, { label: '₅', val: '₅' }, { label: '₆', val: '₆' }, { label: '₇', val: '₇' },
  { label: '₈', val: '₈' }, { label: '₉', val: '₉' },
  { label: '⁺', val: '⁺' }, { label: '⁻', val: '⁻' }, { label: '²', val: '²' }, { label: '³', val: '³' },
  { label: '½', val: '½' }, { label: '¼', val: '¼' }, { label: '¾', val: '¾' },
]

export default function QuestionWorkspace({ questionId, userId, classId, initialSubmission }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('draw')
  const [textAnswer, setTextAnswer] = useState(initialSubmission?.text_answer ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [helpSent, setHelpSent] = useState(false)
  const [helpSending, setHelpSending] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const canvasRef = useRef<DrawingCanvasHandle>(null)

  function insertChem(char: string) {
    const el = textRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = textAnswer.slice(0, start) + char + textAnswer.slice(end)
    setTextAnswer(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + char.length, start + char.length)
    }, 0)
  }

  async function saveSubmission() {
    const payload = {
      question_id: questionId,
      student_id: userId,
      canvas_data: tab === 'draw' ? (canvasRef.current?.getDataUrl() ?? null) : null,
      text_answer: tab === 'type' ? textAnswer : null,
      image_url: null,
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('submissions').upsert(payload, { onConflict: 'question_id,student_id' }).select('id').single()
    return data?.id ?? null
  }

  async function handleSubmit() {
    setSaving(true)
    await saveSubmission()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleDone() {
    setSaving(true)
    await saveSubmission()
    // Notify teacher
    await supabase.from('notifications').insert({
      type: 'submitted',
      student_id: userId,
      question_id: questionId,
      class_id: classId,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleHelp() {
    setHelpSending(true)
    await supabase.from('notifications').insert({
      type: 'help',
      student_id: userId,
      question_id: questionId,
      class_id: classId,
    })
    setHelpSending(false)
    setHelpSent(true)
    setTimeout(() => setHelpSent(false), 5000)
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 w-fit">
        {(['draw', 'type'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'draw' ? '✏️ Draw' : '⌨️ Type'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {tab === 'draw' && (
          <DrawingCanvas ref={canvasRef} height={400} initialData={initialSubmission?.canvas_data} />
        )}
        {tab === 'type' && (
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Chemistry symbols — click to insert:</p>
              <div className="flex flex-wrap gap-1">
                {CHEM_CHARS.map(({ label, val }) => (
                  <button key={val} onClick={() => insertChem(val)}
                    className="px-2 py-1 bg-white border border-gray-200 rounded text-sm hover:bg-purple-50 hover:border-purple-300 transition-colors font-mono">
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <textarea ref={textRef} value={textAnswer} onChange={e => setTextAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-56 border border-gray-200 rounded-lg p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-base font-mono" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {/* Get Help */}
        <button
          onClick={handleHelp}
          disabled={helpSending || helpSent}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all text-sm ${
            helpSent
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300'
          } disabled:opacity-60`}
        >
          {helpSent ? '🙋 Help request sent!' : helpSending ? 'Sending...' : '🙋 Get Help'}
        </button>

        {/* Save quietly */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-sm disabled:opacity-50"
        >
          {saving ? '...' : 'Save'}
        </button>

        {/* Done - notify teacher */}
        <button
          onClick={handleDone}
          disabled={saving}
          className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all text-sm ${
            saved ? 'bg-green-500' : 'bg-purple-600 hover:bg-purple-700'
          } disabled:opacity-50`}
        >
          {saving ? 'Saving...' : saved ? '✓ Submitted!' : '✓ Done — Check my work'}
        </button>
      </div>
    </div>
  )
}
