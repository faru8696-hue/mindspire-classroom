'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')

    if (code) {
      // PKCE flow — exchange the code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError('Reset link is invalid or expired. Please request a new one.')
        else setReady(true)
      })
    } else {
      // Implicit flow fallback — wait for PASSWORD_RECOVERY event from hash
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true)
      })
      // Timeout after 5s
      const t = setTimeout(() => setError('Reset link is invalid or expired. Please request a new one.'), 5000)
      return () => { subscription.unsubscribe(); clearTimeout(t) }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setStatus('loading')
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('done')
      setTimeout(() => router.push('/student'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm">
        <div className="text-3xl mb-4 text-center">🔐</div>
        <h1 className="text-xl font-bold text-purple-900 text-center mb-6">Set New Password</h1>

        {status === 'done' ? (
          <p className="text-green-600 text-center font-medium">✅ Password updated! Redirecting...</p>
        ) : error && !ready ? (
          <div className="text-center space-y-3">
            <p className="text-red-600 text-sm">{error}</p>
            <a href="/login" className="text-purple-600 text-sm hover:underline block">Back to login →</a>
          </div>
        ) : !ready ? (
          <div className="text-center text-gray-500 text-sm space-y-3">
            <div className="text-2xl animate-spin">⏳</div>
            <p>Verifying your reset link...</p>
          </div>
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
