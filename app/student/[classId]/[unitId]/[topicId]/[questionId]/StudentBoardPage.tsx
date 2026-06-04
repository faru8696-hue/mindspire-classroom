'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import InfiniteWhiteboard from '@/components/InfiniteWhiteboard'

interface Props {
  questionId: string
  studentId: string
  classId: string
  submissionId: string | null
  initialStudentData: string | null
  initialTeacherData: string | null
}

export default function StudentBoardPage({ questionId, studentId, classId, initialStudentData, initialTeacherData }: Props) {
  const supabase = createClient()
  const [helpSent, setHelpSent] = useState(false)
  const [doneSent, setDoneSent] = useState(false)

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

  async function handleHelp() {
    await supabase.from('notifications').insert({
      type: 'help',
      student_id: studentId,
      question_id: questionId,
      class_id: classId,
    })
    setHelpSent(true)
    setTimeout(() => setHelpSent(false), 5000)
  }

  async function handleDone() {
    await supabase.from('notifications').insert({
      type: 'submitted',
      student_id: studentId,
      question_id: questionId,
      class_id: classId,
    })
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

      {/* Action bar */}
      <div className="flex gap-2">
        <button
          onClick={handleHelp}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
            helpSent
              ? 'bg-amber-100 text-amber-700 border-amber-300'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
          }`}
        >
          {helpSent ? '🙋 Help request sent!' : '🙋 Get Help'}
        </button>
        <button
          onClick={handleDone}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            doneSent
              ? 'bg-green-500 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {doneSent ? '✓ Teacher notified!' : '✓ Done — Check my work'}
        </button>
      </div>
    </div>
  )
}
