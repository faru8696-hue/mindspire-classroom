'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SchoolTopicsGate({
  complete,
  children,
}: {
  complete: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!complete && pathname !== '/student/school-topics') {
      router.replace('/student/school-topics?required=1')
    }
  }, [complete, pathname])

  // Block render until redirected (avoids flash of protected content)
  if (!complete && pathname !== '/student/school-topics') return null

  return <>{children}</>
}
