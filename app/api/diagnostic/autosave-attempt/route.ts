import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Public endpoint, no session (matches submit-attempt) — called periodically
// while a student is mid-test so a closed tab, crashed browser, or a device
// switch doesn't lose their progress. Upserts DRAFT rows only — no grading
// happens here (is_correct stays null), and submit-attempt's own upsert
// overwrites these with the real graded values at final submit. Silently
// no-ops on anything wrong (missing attempt, already completed) rather than
// surfacing an error a student mid-test would have no way to act on.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    attemptId?: string
    answers?: { questionId: string; selectedIndex?: number; canvasData?: string | null }[]
  } | null

  const attemptId = body?.attemptId
  const answers = body?.answers ?? []
  if (!attemptId || answers.length === 0) return NextResponse.json({ ok: true })

  const admin = await createAdminClient()

  // Never autosave into a completed attempt — a stray in-flight autosave
  // racing with final submit must not clobber the graded answers.
  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('status')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt || attempt.status !== 'in_progress') return NextResponse.json({ ok: true })

  const rows = answers.map(a => ({
    attempt_id: attemptId,
    question_id: a.questionId,
    selected_index: a.selectedIndex ?? null,
    canvas_data: a.canvasData ?? null,
    is_correct: null,
  }))

  const { error } = await admin
    .from('diagnostic_attempt_answers')
    .upsert(rows, { onConflict: 'attempt_id,question_id' })
  if (error) console.error('autosave-attempt error:', error)

  return NextResponse.json({ ok: true })
}
