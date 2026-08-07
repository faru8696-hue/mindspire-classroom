import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sample, mcqFirst } from '@/lib/sample'

// Public endpoint — most visitors have no session at all, so unlike every
// other API route in this app, there is deliberately no getCaller() call
// (which would 403 a logged-out visitor) — everything after the optional
// session check below still goes through the service-role client.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    slug?: string
    parentEmail?: string
  } | null

  const slug = body?.slug?.trim()
  const parentEmail = body?.parentEmail?.trim()

  if (!slug || !parentEmail) {
    return NextResponse.json({ error: 'Parent/guardian email is required.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(parentEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  // If the student is taking this test while logged in (e.g. clicked it
  // from inside their classroom), silently tie the lead to their real
  // account — derived from their own session, never from client input, so
  // it can't be spoofed. Anonymous public visitors simply get null here.
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()

  const admin = await createAdminClient()

  const { data: test } = await admin
    .from('diagnostic_tests')
    .select('id, question_count_per_attempt')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (!test) return NextResponse.json({ error: 'Diagnostic test not found.' }, { status: 404 })

  // Defensive: instant_results is a new column (see
  // add-diagnostic-instant-results.sql) — defaults to true either way (the
  // DB column's own default matches this fallback), since every test on
  // this public route is a lead-magnet quiz. A teacher can turn this off
  // per test from the test dashboard (TestTimingEditor) to hold results for
  // manual review instead, same as a real class test.
  const { data: instantRow } = await admin
    .from('diagnostic_tests')
    .select('instant_results')
    .eq('id', test.id)
    .maybeSingle()
  const instantResults = instantRow?.instant_results ?? true

  const { data: pool } = await admin
    .from('diagnostic_questions')
    .select('id, question_type')
    .eq('diagnostic_test_id', test.id)
    .eq('is_active', true)
  const poolItems = pool ?? []
  if (poolItems.length === 0) {
    return NextResponse.json({ error: 'This diagnostic test has no questions yet.' }, { status: 404 })
  }

  // Degrade gracefully rather than fail while the pool is still growing
  // toward its target size — serve everything available instead of 500ing.
  const want = Math.min(test.question_count_per_attempt, poolItems.length)
  // Random draw + per-student shuffle first (sample), then laid out MCQ
  // section before FRQ section (mcqFirst) — matches a real exam's format
  // while keeping the anti-cheat randomized order within each section.
  const selected = mcqFirst(sample(poolItems, want)).map(q => q.id)

  // Name/phone/student-email are deliberately not collected here — asking
  // for 5 fields before someone can even start a free quiz was killing
  // completions (most people who asked for the link never finished the
  // form). They're captured later, after the student sees real value (their
  // results) — see CompleteLeadProfileForm on the results page.
  const { data: lead, error: leadError } = await admin
    .from('diagnostic_leads')
    .insert({
      diagnostic_test_id: test.id,
      student_name: '',
      student_email: '',
      parent_name: '',
      parent_email: parentEmail,
      parent_phone: '',
      student_id: user?.id ?? null,
    })
    .select('id')
    .single()
  if (leadError || !lead) {
    console.error('start-attempt lead insert error:', leadError)
    return NextResponse.json({ error: 'Could not start the test. Please try again.' }, { status: 500 })
  }

  // results_released defaults to false everywhere else (see
  // add-diagnostic-results-release.sql) so a teacher can review a real,
  // enrolled student's graded test before showing them the score — see
  // app/api/diagnostic/admin/release-results/route.ts. This route is the
  // sole entry point for the public, anonymous lead-magnet quiz (enrolled
  // students go through start-attempt-for-student instead), so it's seeded
  // from the per-test instant_results toggle instead of the shared default.
  const { data: attempt, error: attemptError } = await admin
    .from('diagnostic_attempts')
    .insert({
      diagnostic_test_id: test.id,
      lead_id: lead.id,
      question_ids: selected,
      status: 'in_progress',
      results_released: instantResults,
    })
    .select('id')
    .single()
  if (attemptError || !attempt) {
    console.error('start-attempt attempt insert error:', attemptError)
    return NextResponse.json({ error: 'Could not start the test. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ attemptId: attempt.id })
}
