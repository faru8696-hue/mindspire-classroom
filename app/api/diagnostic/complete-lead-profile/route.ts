import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Public endpoint (mirrors start-attempt) — fills in the lead details
// deliberately deferred at intake (see DiagnosticIntakeForm) once the
// student has already seen their results, rather than gating the free quiz
// itself behind a longer form.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    attemptId?: string
    studentName?: string
    parentName?: string
    parentPhone?: string
  } | null

  const attemptId = body?.attemptId?.trim()
  const studentName = body?.studentName?.trim()
  const parentName = body?.parentName?.trim()
  const parentPhone = body?.parentPhone?.trim()

  if (!attemptId) return NextResponse.json({ error: 'Missing attempt.' }, { status: 400 })
  if (!studentName && !parentName && !parentPhone) {
    return NextResponse.json({ error: 'Please fill in at least one field.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('lead_id')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 })

  const patch: Record<string, string> = {}
  if (studentName) patch.student_name = studentName
  if (parentName) patch.parent_name = parentName
  if (parentPhone) patch.parent_phone = parentPhone

  const { error } = await admin.from('diagnostic_leads').update(patch).eq('id', attempt.lead_id)
  if (error) return NextResponse.json({ error: 'Could not save. Please try again.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
