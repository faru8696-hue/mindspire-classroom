'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Busts the client router cache so the shared teacher layout re-fetches its
// nav badge counts right away. Use on pages that already mark themselves
// "seen" server-side (e.g. inline in the page component) and just need the
// layout to notice.
export default function RefreshLayout() {
  const router = useRouter()
  useEffect(() => { router.refresh() }, [router])
  return null
}
