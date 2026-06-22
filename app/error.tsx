'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the real error in the browser console for diagnosis.
    console.error('App error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-gray-500">Try again — your work is saved.</p>

        {/* Diagnostic details (client error messages are available here) */}
        <pre className="mt-4 text-left text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap text-red-600">
          {error?.message || 'Unknown error'}
          {error?.digest ? `\n\ndigest: ${error.digest}` : ''}
        </pre>

        <div className="mt-5 flex gap-2 justify-center">
          <button
            onClick={reset}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  )
}
