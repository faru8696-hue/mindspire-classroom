import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { suggestWeeklyPlan, WeeklyPlanTopicInput } from '@/lib/gemini'
import { isQuotaExceeded, isOverloaded } from '@/lib/geminiErrors'
import { CLASS_DAYS, CLASS_TIME, nextSessionDates } from '@/lib/classSchedule'

// Teacher-only: re-aggregates the same student-reported topic-coverage data
// the Planning page (app/teacher/planning) shows, and asks Gemini for a
// session-by-session suggestion for the upcoming Tue/Sat/Sun group
// sessions. Never trusts client-supplied topic data — recomputed here from
// student_topic_plans, same as generate-deep-report re-aggregates its own
// inputs server-side.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { classId } = await req.json() as { classId: string }
  if (!classId) return NextResponse.json({ error: 'Missing classId' }, { status: 400 })

  const admin = await createAdminClient()

  const [{ data: cls }, { data: units }, { data: enrollmentsFull, error: enrollErr }] = await Promise.all([
    admin.from('classes').select('id, title').eq('id', classId).single(),
    admin.from('units').select('id, title, order_index').eq('class_id', classId).order('order_index'),
    admin.from('class_enrollments').select('student_id, in_group').eq('class_id', classId),
  ])
  if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

  // Fallback if the in_group migration hasn't run yet — treat everyone as
  // in-group, same defensive pattern used elsewhere in this feature.
  const enrollments: { student_id: string; in_group?: boolean }[] = enrollErr
    ? ((await admin.from('class_enrollments').select('student_id').eq('class_id', classId)).data ?? [])
    : (enrollmentsFull ?? [])
  const inGroupStudentIds = new Set(enrollments.filter(e => e.in_group !== false).map(e => e.student_id))
  const totalStudents = inGroupStudentIds.size

  const unitIds = (units ?? []).map((u: { id: string }) => u.id)
  const { data: topics } = unitIds.length > 0
    ? await admin.from('topics').select('id, unit_id, title, order_index').in('unit_id', unitIds).order('order_index')
    : { data: [] }

  const { data: plansRaw } = await admin.from('student_topic_plans').select('student_id, topic_id, test_date').eq('class_id', classId)
  const plans = (plansRaw ?? []).filter((p: { student_id: string }) => inGroupStudentIds.has(p.student_id))

  const planCountByTopic = new Map<string, number>()
  const nearestTestDateByTopic = new Map<string, string>()
  for (const p of plans) {
    planCountByTopic.set(p.topic_id, (planCountByTopic.get(p.topic_id) ?? 0) + 1)
    if (p.test_date) {
      const cur = nearestTestDateByTopic.get(p.topic_id)
      if (!cur || p.test_date < cur) nearestTestDateByTopic.set(p.topic_id, p.test_date)
    }
  }

  const unitTitleById = new Map((units ?? []).map((u: { id: string; title: string }) => [u.id, u.title]))
  const topicInputs: WeeklyPlanTopicInput[] = (topics ?? [])
    .filter((t: { id: string }) => (planCountByTopic.get(t.id) ?? 0) > 0)
    .map((t: { id: string; unit_id: string; title: string }) => ({
      unitTitle: unitTitleById.get(t.unit_id) ?? '',
      topicTitle: t.title,
      studentsReporting: planCountByTopic.get(t.id) ?? 0,
      studentsEnrolled: totalStudents,
      nearestTestDate: nearestTestDateByTopic.get(t.id) ?? null,
    }))

  try {
    const todayIso = new Date().toISOString().slice(0, 10)
    // ~4 weeks of slots (3/week) — the model picks however many it
    // actually needs, it isn't required to fill all of them.
    const availableSessionDates = nextSessionDates(CLASS_DAYS, todayIso, 12)
    const result = await suggestWeeklyPlan(cls.title, CLASS_DAYS, CLASS_TIME, availableSessionDates, topicInputs, todayIso)

    // Persist so the plan survives a reload instead of only living in
    // client state — one row per class, regenerating overwrites it and
    // resets shared to false so a new plan always needs a deliberate
    // re-share rather than silently replacing what students already see.
    const { data: saved, error: saveError } = await admin.from('weekly_plans')
      .upsert(
        { class_id: classId, feasibility_note: result.feasibilityNote, sessions: result.sessions, generated_at: new Date().toISOString(), shared: false, shared_at: null },
        { onConflict: 'class_id' },
      )
      .select('generated_at, shared')
      .single()
    if (saveError) console.error('Failed to persist weekly plan:', saveError)

    return NextResponse.json({ ...result, generatedAt: saved?.generated_at ?? new Date().toISOString(), shared: saved?.shared ?? false })
  } catch (err) {
    console.error('suggest-weekly-plan error:', err)
    const message = err instanceof Error ? err.message : String(err)
    if (isQuotaExceeded(message)) {
      return NextResponse.json({ error: 'AI plan: daily limit reached. Try again tomorrow.' }, { status: 429 })
    }
    return NextResponse.json(
      { error: isOverloaded(message) ? 'AI plan is not available right now. Please try again in a bit.' : `Plan generation failed: ${message}` },
      { status: 503 },
    )
  }
}
