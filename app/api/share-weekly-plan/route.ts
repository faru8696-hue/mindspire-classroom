import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Toggles whether a class's current weekly plan is visible on that class's
// students' dashboards (app/student/page.tsx reads weekly_plans where
// shared = true via the "weekly_plans_student_read_shared" RLS policy).
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { classId, shared } = await req.json() as { classId: string; shared: boolean }
  if (!classId || typeof shared !== 'boolean') {
    return NextResponse.json({ error: 'Missing classId or shared' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('weekly_plans')
    .update({ shared, shared_at: shared ? new Date().toISOString() : null })
    .eq('class_id', classId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
