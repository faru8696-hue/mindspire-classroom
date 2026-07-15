import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Marks a nav section (submissions/students/activity) as seen right now —
// this is what makes that section's badge in the nav clear on visit, same
// behavior as the Self Study badge.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { navKey } = await req.json() as { navKey: string }
  if (!navKey) return NextResponse.json({ error: 'Missing navKey' }, { status: 400 })

  const admin = await createAdminClient()
  await admin.from('teacher_nav_seen').upsert({ nav_key: navKey, seen_at: new Date().toISOString() }, { onConflict: 'nav_key' })

  return NextResponse.json({ ok: true })
}
