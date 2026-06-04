import { type NextRequest, NextResponse } from 'next/server'

// Allow all requests through — each page handles its own auth check
export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
