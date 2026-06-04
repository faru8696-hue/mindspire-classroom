'use client'

import { createClient } from '@/lib/supabase/client'
import InfiniteWhiteboard from '@/components/InfiniteWhiteboard'

interface Props {
  questionId: string
  studentId: string
  initialStudentData: string | null
}

export default function TeacherWatchBoard({ questionId, studentId, initialStudentData }: Props) {
  const supabase = createClient()

  async function saveTeacher(dataUrl: string) {
    // Teacher annotations saved to feedback canvas_data
    const { data: sub } = await supabase
      .from('submissions')
      .select('id')
      .eq('question_id', questionId)
      .eq('student_id', studentId)
      .maybeSingle()
    if (!sub?.id) return
    await supabase.from('feedback').upsert(
      { submission_id: sub.id, canvas_data: dataUrl },
      { onConflict: 'submission_id' }
    )
  }

  return (
    <InfiniteWhiteboard
      questionId={questionId}
      studentId={studentId}
      role="teacher"
      initialStudentData={initialStudentData}
      initialTeacherData={null}
      onSaveTeacher={saveTeacher}
    />
  )
}
