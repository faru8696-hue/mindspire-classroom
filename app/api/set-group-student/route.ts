import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// class_enrollments has no teacher write RLS policy (only service-role and
// "students read own"), so this admin-mediated route is required — same
// reasoning as the RLS-blocked tables noted elsewhere in this project.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId, classId, inGroup } = await req.json() as { studentId: string; classId: string; inGroup: boolean }
  if (!studentId || !classId || typeof inGroup !== 'boolean') {
    return NextResponse.json({ error: 'Missing studentId, classId, or inGroup' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('class_enrollments')
    .update({ in_group: inGroup }).eq('student_id', studentId).eq('class_id', classId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
