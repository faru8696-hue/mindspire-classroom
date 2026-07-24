import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sample } from '@/lib/sample'

// For an already-enrolled, logged-in student starting a test published to
// their class — skips the public lead-capture form entirely by reusing the
// contact info already on file from enrollment (profiles.full_name/email/
// parent_*). Falls back to an error (never fabricates data) if any of that
// is missing, so the caller can send the student to the normal /diagnostic/
// [slug] intake form instead.
export async function POST(req: NextRequest) {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 })

  const { slug } = await req.json().catch(() => ({})) as { slug?: string }
  if (!slug) return NextResponse.json({ error: 'slug is required.' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email, parent_name, parent_email, parent_phone, role, approved')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'student' || !profile.approved) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  if (!profile.full_name || !profile.email || !profile.parent_name || !profile.parent_email || !profile.parent_phone) {
    return NextResponse.json({ error: 'Missing contact info on file.', missingProfileInfo: true }, { status: 400 })
  }

  const { data: test } = await admin
    .from('diagnostic_tests')
    .select('id, question_count_per_attempt')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (!test) return NextResponse.json({ error: 'Test not found.' }, { status: 404 })

  const { data: pool } = await admin
    .from('diagnostic_questions')
    .select('id')
    .eq('diagnostic_test_id', test.id)
    .eq('is_active', true)
  const poolIds = (pool ?? []).map(q => q.id)
  if (poolIds.length === 0) {
    return NextResponse.json({ error: 'This test has no questions yet.' }, { status: 404 })
  }

  const want = Math.min(test.question_count_per_attempt, poolIds.length)
  const selected = sample(poolIds, want)

  const { data: lead, error: leadError } = await admin
    .from('diagnostic_leads')
    .insert({
      diagnostic_test_id: test.id,
      student_name: profile.full_name,
      student_email: profile.email,
      parent_name: profile.parent_name,
      parent_email: profile.parent_email,
      parent_phone: profile.parent_phone,
      student_id: user.id,
    })
    .select('id')
    .single()
  if (leadError || !lead) {
    return NextResponse.json({ error: 'Could not start the test. Please try again.' }, { status: 500 })
  }

  const { data: attempt, error: attemptError } = await admin
    .from('diagnostic_attempts')
    .insert({
      diagnostic_test_id: test.id,
      lead_id: lead.id,
      question_ids: selected,
      status: 'in_progress',
    })
    .select('id')
    .single()
  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Could not start the test. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ attemptId: attempt.id })
}
