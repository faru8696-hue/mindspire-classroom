export type Role = 'teacher' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  approved: boolean
  created_at: string
}

export interface Unit {
  id: string
  title: string
  description: string | null
  order_index: number
  created_by: string
  created_at: string
}

export interface Topic {
  id: string
  unit_id: string
  title: string
  description: string | null
  order_index: number
  created_at: string
}

export interface Question {
  id: string
  topic_id: string
  title: string
  content: string | null
  order_index: number
  created_at: string
}

export interface Submission {
  id: string
  question_id: string
  student_id: string
  canvas_data: string | null
  text_answer: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Feedback {
  id: string
  submission_id: string
  teacher_id: string
  canvas_data: string | null
  text_feedback: string | null
  created_at: string
  updated_at: string
}
