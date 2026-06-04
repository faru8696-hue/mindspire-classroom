import { logout } from '@/app/actions/auth'

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-purple-900 mb-2">Waiting for Approval</h1>
        <p className="text-gray-600 mb-6">
          Your account has been created. Your teacher needs to approve you before you can access the classroom.
          Check back soon!
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
