'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import InfiniteWhiteboard from '@/components/InfiniteWhiteboard'

interface Props {
  questionId: string
  studentId: string
  classId: string
  studentName: string
  questionTitle: string
  submissionId: string | null
  initialStudentData: string | null
  initialTeacherData: string | null
}

const GRADE_LABEL: Record<string, { text: string; cls: string }> = {
  correct:   { text: '✓ Correct!',         cls: 'bg-green-500 text-white' },
  partial:   { text: '~ Partially correct', cls: 'bg-amber-400 text-white' },
  discussed: { text: '💬 Discussed',        cls: 'bg-blue-500 text-white' },
  incorrect: { text: '✗ Incorrect',         cls: 'bg-red-500 text-white' },
  needsmore: { text: '🔄 Needs more work',  cls: 'bg-purple-600 text-white' },
}

export default function StudentBoardPage({
  questionId, studentId, classId, studentName, questionTitle,
  initialStudentData, initialTeacherData,
}: Props) {
  const supabase = createClient()
  const [helpSent, setHelpSent] = useState(false)
  const [doneSent, setDoneSent] = useState(false)
  const [gradeToast, setGradeToast] = useState<{ grade: string; feedback: string } | null>(null)
  const channelRef = useRef(supabase.channel('teacher-alerts'))
  const audioRef = useRef<AudioContext | null>(null)

  function playTone(freq: number, duration = 0.4) {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(); osc.stop(ctx.currentTime + duration)
    } catch {}
  }

  // Listen for grade notifications from teacher
  useEffect(() => {
    const ch = supabase.channel(`student-feedback:${studentId}`)
      .on('broadcast', { event: 'grade-received' }, ({ payload }) => {
        const { question_id, grade, feedback } = payload as { question_id: string; grade: string; feedback: string }
        if (question_id !== questionId) return
        setGradeToast({ grade, feedback })
        // Happy tone for correct, lower tone otherwise
        playTone(grade === 'correct' ? 660 : grade === 'partial' ? 520 : 330)
        setTimeout(() => setGradeToast(null), 8000)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [studentId, questionId])

  async function saveStudent(dataUrl: string) {
    await supabase.from('submissions').upsert({
      question_id: questionId,
      student_id: studentId,
      canvas_data: dataUrl,
      text_answer: null,
      image_url: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'question_id,student_id' })
  }

  async function sendAlert(type: 'help' | 'submitted') {
    const now = new Date().toISOString()
    const { data: inserted, error } = await supabase.from('notifications').insert({
      type, student_id: studentId, question_id: questionId, class_id: classId,
    }).select('id').single()
    if (error) console.error('notification insert error:', error)
    await channelRef.current.send({
      type: 'broadcast', event: 'student-alert',
      payload: {
        id: inserted?.id ?? crypto.randomUUID(),
        type, student_id: studentId, question_id: questionId, class_id: classId,
        created_at: now, read: false, student_name: studentName, question_title: questionTitle,
      },
    })
  }

  async function handleHelp() {
    await sendAlert('help')
    setHelpSent(true)
    setTimeout(() => setHelpSent(false), 5000)
  }

  async function handleDone() {
    await sendAlert('submitted')
    setDoneSent(true)
    setTimeout(() => setDoneSent(false), 5000)
  }

  return (
    <div className="flex flex-col h-full gap-2 relative">
      {/* Grade toast notification */}
      {gradeToast && (
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm animate-bounce ${GRADE_LABEL[gradeToast.grade]?.cls ?? 'bg-gray-800 text-white'}`}>
          <span>{GRADE_LABEL[gradeToast.grade]?.text ?? gradeToast.grade}</span>
          {gradeToast.feedback && <span className="opacity-90 font-normal">— {gradeToast.feedback}</span>}
          <button onClick={() => setGradeToast(null)} className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      <InfiniteWhiteboard
        questionId={questionId}
        studentId={studentId}
        role="student"
        initialStudentData={initialStudentData}
        initialTeacherData={initialTeacherData}
        onSaveStudent={saveStudent}
      />

      <div className="flex gap-2">
        <button
          onClick={handleHelp}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border ${
            helpSent ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
          }`}
        >
          {helpSent ? '🙋 Help request sent!' : '🙋 Get Help'}
        </button>
        <button
          onClick={handleDone}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
            doneSent ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {doneSent ? '✅ Teacher notified!' : '✓ Done — Check my work'}
        </button>
      </div>
    </div>
  )
}
