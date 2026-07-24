import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only. The app/teacher/layout.tsx auth gate covers the *pages*
// under /teacher/*, but does not extend to /api/* routes — this check is
// the actual gate for this endpoint (same pattern as save-answer-key).
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { title, slug, description, questionCountPerAttempt, durationMinutes } = await req.json()
  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('diagnostic_tests')
    .insert({
      title,
      slug,
      description: description || null,
      question_count_per_attempt: questionCountPerAttempt || 90,
      duration_minutes: durationMinutes || 120,
    })
    .select('id')
    .single()

  if (error) {
    const message = error.code === '23505' ? 'That slug is already in use — choose a different one.' : error.message
    return NextResponse.json({ error: message }, { status: error.code === '23505' ? 409 : 500 })
  }
  return NextResponse.json({ testId: data.id })
}
