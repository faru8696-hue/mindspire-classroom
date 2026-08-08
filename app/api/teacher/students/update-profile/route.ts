import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId, fullName, nickname, email, gradeLevel, phone, parentName, parentPhone, parentEmail } = await req.json() as {
    studentId?: string
    fullName?: string
    nickname?: string
    email?: string
    gradeLevel?: string
    phone?: string
    parentName?: string
    parentPhone?: string
    parentEmail?: string
  }
  if (!studentId || !fullName) {
    return NextResponse.json({ error: 'studentId and fullName are required.' }, { status: 400 })
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid student email.' }, { status: 400 })
  }
  if (parentEmail && !EMAIL_RE.test(parentEmail)) {
    return NextResponse.json({ error: 'Please enter a valid parent/guardian email.' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Core fields — same columns app/teacher/students/[studentId]/page.tsx
  // always selects, so this update must always succeed.
  const { error } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      nickname: nickname || null,
      email: email || null,
      grade_level: gradeLevel || null,
      phone: phone || null,
    })
    .eq('id', studentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Separate, best-effort — parent_name/parent_phone/parent_email only exist
  // once the migration adding them has been run (the student detail page
  // already reads these via a separate query for the same reason).
  const { error: parentError } = await admin
    .from('profiles')
    .update({
      parent_name: parentName || null,
      parent_phone: parentPhone || null,
      parent_email: parentEmail || null,
    })
    .eq('id', studentId)
  if (parentError) console.error('update-profile parent fields error (migration likely not run yet):', parentError)

  return NextResponse.json({ ok: true })
}
