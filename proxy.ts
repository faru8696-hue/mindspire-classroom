import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Refresh the Supabase auth session on every request and propagate the rotated
// auth cookies to the response. Server Components can READ cookies but cannot
// WRITE them, so without this the refreshed token is never persisted — the next
// render then sees an expired/used token, getSession() returns null, and pages
// that read session!.user.id throw a 500 ("This page couldn't load"). Doing the
// refresh here keeps the session valid across requests. Each page still does its
// own auth check, so this is an optimistic refresh, not the authorization layer.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Triggers a token refresh when needed; the rotated cookies are written via setAll.
    await supabase.auth.getUser()
  } catch {
    // Never let an auth/network hiccup turn into a 500 for every request —
    // fall through and let the page handle its own auth.
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
