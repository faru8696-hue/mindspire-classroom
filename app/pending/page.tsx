import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  // If already approved, send them to student dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('approved, pending_class_id')
    .eq('id', session.user.id)
    .single()

  if (profile?.approved) redirect('/student')

  let pendingClassName: string | null = null
  if (profile?.pending_class_id) {
    const { data: cls } = await supabase
      .from('classes')
      .select('title')
      .eq('id', profile.pending_class_id)
      .single()
    pendingClassName = cls?.title ?? null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-purple-900 mb-2">Application Submitted!</h1>

        {pendingClassName ? (
          <>
            <p className="text-gray-600 mb-2">
              You applied for <span className="font-semibold text-purple-700">{pendingClassName}</span>.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Your teacher will review your application and approve your access. Check back soon!
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-3">Your account is waiting for teacher approval.</p>
            <Link
              href="/choose-class"
              className="inline-block mb-6 text-sm text-purple-600 hover:underline font-medium"
            >
              ← Choose a class first
            </Link>
          </>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-amber-800 mb-1">What happens next?</p>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>Your teacher reviews your application</li>
            <li>Once approved, you&apos;ll get access to your class</li>
            <li>Sign in again to enter the classroom</li>
          </ol>
        </div>

        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 underline">
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
