'use client'

import { useState, useRef } from 'react'
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

export default function StudentBoardPage({
  questionId, studentId, classId, studentName, questionTitle,
  initialStudentData, initialTeacherData,
}: Props) {
  const supabase = createClient()
  const [helpSent, setHelpSent] = useState(false)
  const [doneSent, setDoneSent] = useState(false)
  const channelRef = useRef(supabase.channel('teacher-alerts'))

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

    // 1. Save to DB for persistence
    const { data: inserted, error } = await supabase.from('notifications').insert({
      type,
      student_id: studentId,
      question_id: questionId,
      class_id: classId,
    }).select('id').single()

    if (error) console.error('notification insert error:', error)

    // 2. Broadcast on channel so teacher gets it instantly (bypasses RLS)
    await channelRef.current.send({
      type: 'broadcast',
      event: 'student-alert',
      payload: {
        id: inserted?.id ?? crypto.randomUUID(),
        type,
        student_id: studentId,
        question_id: questionId,
        class_id: classId,
        created_at: now,
        read: false,
        student_name: studentName,
        question_title: questionTitle,
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
    <div className="flex flex-col h-full gap-2">
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
            helpSent
              ? 'bg-amber-100 text-amber-700 border-amber-300'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
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
