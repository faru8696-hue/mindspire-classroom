import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { sendDiagnosticResultEmail } from '@/lib/sendDiagnosticResultEmail'

// Teacher-only: sends immediately to the student/parent, no preview step —
// the "Send to Parent" option in EmailResultButton, alongside "Send Preview
// to Me" (email-result/route.ts, which holds it for confirmation instead).
// The modal itself is already the review step here (composed note, MCQ/FRQ
// scope, parent email shown before sending), so this is for a teacher who's
// already satisfied with what they see and doesn't want the extra round
// trip through their own inbox.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { attemptId, teacherNote, includeMcq = true, includeFrq = true, includeIntegrityNote = true } = await req.json() as {
    attemptId?: string
    teacherNote?: string | null
    includeMcq?: boolean
    includeFrq?: boolean
    includeIntegrityNote?: boolean
  }
  if (!attemptId) return NextResponse.json({ error: 'attemptId is required.' }, { status: 400 })
  if (!includeMcq && !includeFrq) return NextResponse.json({ error: 'Include at least one of Multiple Choice or Free Response.' }, { status: 400 })

  const admin = await createAdminClient()
  const outcome = await sendDiagnosticResultEmail(admin, {
    attemptId,
    teacherNote: teacherNote?.trim() || null,
    includeMcq,
    includeFrq,
    includeIntegrityNote,
  })
  if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.status })

  return NextResponse.json({ ok: true, sentTo: outcome.sentTo, errors: outcome.errors })
}
