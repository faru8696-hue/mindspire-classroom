'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotStatus('loading')
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setForgotStatus('sent')
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    // Wrapped in try/catch/finally so a thrown error (network blip, a
    // browser extension blocking the request, etc. — not just a normal
    // "wrong password" response) can't leave the button stuck on
    // "Signing in..." forever with no way to retry short of a page reload.
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      })

      if (signInError || !data.user) {
        setError(signInError?.message ?? 'Login failed')
        return
      }

      // Get profile and route to correct dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, approved')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        setError('Account not set up yet. Please try again in a moment.')
        return
      }

      if (profile.role === 'teacher') {
        window.location.href = '/teacher'
      } else if (!profile.approved) {
        window.location.href = '/pending'
      } else {
        window.location.href = '/student'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong signing in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚛️</div>
          <h1 className="text-2xl font-bold text-purple-900">Mindspire Lab Classroom</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {forgotMode ? (
          forgotStatus === 'sent' ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📬</div>
              <p className="text-gray-700 font-medium">Check your email</p>
              <p className="text-sm text-gray-500">We sent a password reset link to <strong>{forgotEmail}</strong></p>
              <button onClick={() => { setForgotMode(false); setForgotStatus('idle') }} className="text-purple-600 text-sm hover:underline">Back to sign in</button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-600">Enter your email and we'll send you a reset link.</p>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="you@example.com"
              />
              <button
                type="submit"
                disabled={forgotStatus === 'loading'}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {forgotStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setForgotMode(false)} className="w-full text-sm text-gray-500 hover:underline">Back to sign in</button>
            </form>
          )
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-purple-600 hover:underline">Forgot password?</button>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              No account?{' '}
              <Link href="/register" className="text-purple-600 font-medium hover:underline">
                Register here
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
