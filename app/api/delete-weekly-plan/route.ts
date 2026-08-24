import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { classId } = await req.json() as { classId: string }
  if (!classId) return NextResponse.json({ error: 'Missing classId' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('weekly_plans').delete().eq('class_id', classId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
