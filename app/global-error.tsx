'use client'

import { useEffect } from 'react'

// Catches errors that the segment error.tsx can't — including failures in the
// root layout and RSC transport errors (the ones that otherwise show the bare
// "This page couldn't load" screen). Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Something went wrong</h2>
          <p style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>Try again — your work is saved.</p>
          <pre style={{
            marginTop: 16, textAlign: 'left', fontSize: 12, background: '#f9fafb',
            border: '1px solid #f3f4f6', borderRadius: 8, padding: 12, overflow: 'auto',
            maxHeight: 200, whiteSpace: 'pre-wrap', color: '#dc2626',
          }}>
            {error?.message || 'Unknown error'}
            {error?.digest ? `\n\ndigest: ${error.digest}` : ''}
          </pre>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={reset} style={{ background: '#7c3aed', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Try again</button>
            <button onClick={() => window.location.reload()} style={{ background: '#f3f4f6', color: '#374151', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Reload</button>
          </div>
        </div>
      </body>
    </html>
  )
}
