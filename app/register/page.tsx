'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Class { id: string; title: string; order_index: number }

const CLASS_INFO: Record<string, { icon: string; who: string }> = {
  'honors chem': {
    icon: '🧪',
    who: 'For students taking regular chemistry or honors chemistry.',
  },
  'ap chem advanced': {
    icon: '🔬',
    who: 'For students who have previously completed regular or honors chemistry.',
  },
  'ap chem': {
    icon: '⚗️',
    who: 'For students taking AP Chemistry with no prior chemistry background.',
  },
}

function getInfo(title: string) {
  const key = title.toLowerCase().trim()
  for (const [k, v] of Object.entries(CLASS_INFO)) {
    if (key.includes(k)) return v
  }
  return { icon: '📚', who: '' }
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTeacherCode, setShowTeacherCode] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  // Form values carried between steps
  const [form, setForm] = useState({ full_name: '', email: '', password: '', teacher_code: '' })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('classes').select('id, title, order_index').order('order_index').then(({ data }) => {
      setClasses(data ?? [])
    })
  }, [])

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const isTeacher = (fd.get('teacher_code') as string) === 'mindspire2024'
    setForm({
      full_name: fd.get('full_name') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      teacher_code: fd.get('teacher_code') as string,
    })
    if (isTeacher) {
      // Teachers don't need a class — submit directly
      submitRegistration(
        fd.get('full_name') as string,
        fd.get('email') as string,
        fd.get('password') as string,
        true,
        null
      )
    } else {
      setStep(2)
    }
  }

  async function submitRegistration(
    full_name: string,
    email: string,
    password: string,
    isTeacher: boolean,
    classId: string | null
  ) {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, role: isTeacher ? 'teacher' : 'student' } },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Registration failed')
      setLoading(false)
      return
    }

    if (isTeacher) {
      router.push('/teacher')
      return
    }

    // Save the chosen class to the profile
    if (classId) {
      await fetch('/api/apply-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, classId }),
      })
    }

    router.push('/pending')
    router.refresh()
  }

  function handleStep2(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClass) { setError('Please select a class.'); return }
    submitRegistration(form.full_name, form.email, form.password, false, selectedClass)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚛️</div>
          <h1 className="text-2xl font-bold text-purple-900">
            {step === 1 ? 'Create Account' : 'Choose Your Class'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {step === 1 ? 'Join the Mindspire classroom' : 'Select the class that matches your chemistry level'}
          </p>
        </div>

        {/* Step indicator */}
        {!showTeacherCode && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-purple-600 text-white' : 'bg-green-500 text-white'}`}>
              {step === 1 ? '1' : '✓'}
            </div>
            <div className={`h-1 w-12 rounded ${step === 2 ? 'bg-purple-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
              2
            </div>
          </div>
        )}

        {/* Step 1 — account info */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="full_name" type="text" required defaultValue={form.full_name}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" required defaultValue={form.email}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" required minLength={6} defaultValue={form.password}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="At least 6 characters" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isTeacher" onChange={e => setShowTeacherCode(e.target.checked)} className="rounded" />
              <label htmlFor="isTeacher" className="text-sm text-gray-700">I am a teacher</label>
            </div>

            {showTeacherCode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Code</label>
                <input name="teacher_code" type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter teacher code" />
              </div>
            )}
            {!showTeacherCode && <input type="hidden" name="teacher_code" value="" />}

            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Creating account...' : showTeacherCode ? 'Create Account' : 'Next: Choose Class →'}
            </button>
          </form>
        )}

        {/* Step 2 — class picker */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-3">
            {classes.length === 0 ? (
              <p className="text-center text-gray-400 py-4">Loading classes...</p>
            ) : classes.map(cls => {
              const info = getInfo(cls.title)
              const isSelected = selectedClass === cls.id
              return (
                <button type="button" key={cls.id} onClick={() => { setSelectedClass(cls.id); setError('') }}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{cls.title}</p>
                        {isSelected && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Selected</span>}
                      </div>
                      {info.who && <p className="text-sm text-gray-500 mt-0.5">{info.who}</p>}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                </button>
              )
            })}

            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                ← Back
              </button>
              <button type="submit" disabled={loading || !selectedClass}
                className="flex-2 flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-40">
                {loading ? 'Applying...' : 'Apply →'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
