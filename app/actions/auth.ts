'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect('/')
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const teacherCode = formData.get('teacher_code') as string

  const isTeacher = teacherCode === process.env.TEACHER_SIGNUP_CODE
  const role = isTeacher ? 'teacher' : 'student'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role } },
  })

  if (error) return { error: error.message }

  if (isTeacher) redirect('/teacher')
  redirect('/pending')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
