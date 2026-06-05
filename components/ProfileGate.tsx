'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfileGate({
  profileComplete,
  children,
}: {
  profileComplete: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!profileComplete && pathname !== '/student/profile') {
      router.replace('/student/profile?required=1')
    }
  }, [profileComplete, pathname])

  // Block render until redirected (avoids flash of protected content)
  if (!profileComplete && pathname !== '/student/profile') return null

  return <>{children}</>
}
