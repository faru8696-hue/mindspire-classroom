'use client'

import { createClient } from '@/lib/supabase/client'
import InfiniteWhiteboard from '@/components/InfiniteWhiteboard'

interface Props {
  questionId: string
  studentId: string
  submissionId: string | null
  initialStudentData: string | null
  initialTeacherData: string | null
}

export default function StudentBoardPage({ questionId, studentId, submissionId, initialStudentData, initialTeacherData }: Props) {
  const supabase = createClient()

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

  return (
    <InfiniteWhiteboard
      questionId={questionId}
      studentId={studentId}
      role="student"
      initialStudentData={initialStudentData}
      initialTeacherData={initialTeacherData}
      onSaveStudent={saveStudent}
    />
  )
}
