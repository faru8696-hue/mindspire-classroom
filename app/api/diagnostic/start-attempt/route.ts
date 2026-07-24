import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sample } from '@/lib/sample'

// Public endpoint — most visitors have no session at all, so unlike every
// other API route in this app, there is deliberately no getCaller() call
// (which would 403 a logged-out visitor) — everything after the optional
// session check below still goes through the service-role client.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    slug?: string
    studentName?: string
    studentEmail?: string
    parentName?: string
    parentEmail?: string
    parentPhone?: string
  } | null

  const slug = body?.slug?.trim()
  const studentName = body?.studentName?.trim()
  const studentEmail = body?.studentEmail?.trim()
  const parentName = body?.parentName?.trim()
  const parentEmail = body?.parentEmail?.trim()
  const parentPhone = body?.parentPhone?.trim()

  if (!slug || !studentName || !studentEmail || !parentName || !parentEmail || !parentPhone) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }
  if (!EMAIL_RE.test(studentEmail) || !EMAIL_RE.test(parentEmail)) {
    return NextResponse.json({ error: 'Please enter valid email addresses.' }, { status: 400 })
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

  const { data: pool } = await admin
    .from('diagnostic_questions')
    .select('id')
    .eq('diagnostic_test_id', test.id)
    .eq('is_active', true)
  const poolIds = (pool ?? []).map(q => q.id)
  if (poolIds.length === 0) {
    return NextResponse.json({ error: 'This diagnostic test has no questions yet.' }, { status: 404 })
  }

  // Degrade gracefully rather than fail while the pool is still growing
  // toward its target size — serve everything available instead of 500ing.
  const want = Math.min(test.question_count_per_attempt, poolIds.length)
  const selected = sample(poolIds, want)

  const { data: lead, error: leadError } = await admin
    .from('diagnostic_leads')
    .insert({
      diagnostic_test_id: test.id,
      student_name: studentName,
      student_email: studentEmail,
      parent_name: parentName,
      parent_email: parentEmail,
      parent_phone: parentPhone,
      student_id: user?.id ?? null,
    })
    .select('id')
    .single()
  if (leadError || !lead) {
    console.error('start-attempt lead insert error:', leadError)
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
    console.error('start-attempt attempt insert error:', attemptError)
    return NextResponse.json({ error: 'Could not start the test. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ attemptId: attempt.id })
}
