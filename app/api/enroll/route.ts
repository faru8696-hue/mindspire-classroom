import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { studentId, classId, action } = await req.json()

  if (!studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })
  }

  const admin = await createAdminClient()

  if (action === 'remove') {
    await admin.from('profiles').update({ approved: false }).eq('id', studentId)
    await admin.from('class_enrollments').delete().eq('student_id', studentId)
    return NextResponse.json({ ok: true })
  }

  if (!classId) {
    return NextResponse.json({ error: 'Missing classId' }, { status: 400 })
  }

  if (action === 'unenroll') {
    const { error } = await admin.from('class_enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', classId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin.from('class_enrollments')
      .upsert({ student_id: studentId, class_id: classId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
