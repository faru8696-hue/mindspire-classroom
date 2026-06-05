'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  // Supabase sends access_token in the URL hash — exchange it for a session
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStatus('idle')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setStatus('loading')
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setStatus('error') }
    else { setStatus('done'); setTimeout(() => router.push('/student'), 2000) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm">
        <div className="text-3xl mb-4 text-center">🔐</div>
        <h1 className="text-xl font-bold text-purple-900 text-center mb-6">Set New Password</h1>
        {status === 'done' ? (
          <p className="text-green-600 text-center font-medium">Password updated! Redirecting...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
