import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { formatDayLabel } from '@/lib/classSchedule'
import type { WeeklyPlanSession } from '@/lib/gemini'

// Teacher-only: lets the teacher hand-edit a single date's session on an
// already-generated plan directly from the calendar — set (add or update)
// the topics for a date, or remove that date's session entirely. Doesn't
// touch shared/generated_at — this is a small refinement of what's there,
// not a regeneration, so an already-shared plan stays shared.
type Body =
  | { classId: string; date: string; action: 'set'; focusTopics: string[] }
  | { classId: string; date: string; action: 'remove' }

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json() as Body
  if (!body.classId || !body.date) return NextResponse.json({ error: 'Missing classId or date' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: plan, error: fetchError } = await admin
    .from('weekly_plans').select('sessions').eq('class_id', body.classId).single()
  if (fetchError || !plan) return NextResponse.json({ error: 'No plan found for this class yet' }, { status: 404 })

  const sessions = (plan.sessions as WeeklyPlanSession[]).filter(s => s.date !== body.date)

  if (body.action === 'set') {
    const focusTopics = body.focusTopics.map(t => t.trim()).filter(Boolean)
    if (focusTopics.length === 0) return NextResponse.json({ error: 'At least one topic is required' }, { status: 400 })
    sessions.push({
      date: body.date,
      dayLabel: formatDayLabel(body.date),
      focusTopics,
      rationale: 'Manually added/edited by the teacher.',
      homeworkSuggestion: null,
    })
  }
  sessions.sort((a, b) => a.date.localeCompare(b.date))

  const { error: updateError } = await admin.from('weekly_plans').update({ sessions }).eq('class_id', body.classId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ sessions })
}
