'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Marks a nav section as seen and forces the shared teacher layout to
// re-render with fresh badge counts. Next.js's client-side router cache
// reuses the layout's last-rendered output across sibling navigations even
// with `dynamic = 'force-dynamic'` on the page — router.refresh() is what
// actually busts that cache and re-fetches the layout's server data, which
// is what makes the badge clear immediately instead of on the next full
// page load.
export default function MarkNavSeen({ navKey }: { navKey: string }) {
  const router = useRouter()
  useEffect(() => {
    fetch('/api/teacher-nav-seen', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ navKey }),
    }).then(() => router.refresh()).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
