import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Builds a custom self-study test: picks up to `counts[difficulty]` random
// questions per difficulty level from the student's enrolled class (optionally
// narrowed to specific topics), independent of what the teacher has assigned —
// this is self-directed practice, not the assignment queue.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { classId, topicIds, counts, totalCount, questionType, durationMinutes, title } = await req.json() as {
    classId: string
    topicIds?: string[] | null
    // Difficulty-based selection (AP Chemistry, which has difficulty data).
    counts?: { easy?: number; medium?: number; hard?: number }
    // Flat count, ignoring difficulty (Honors Chemistry, which has none).
    totalCount?: number
    questionType?: 'frq' | 'mcq' | 'any'
    durationMinutes?: number | null
    title?: string
  }
  if (!classId || (!counts && !totalCount)) {
    return NextResponse.json({ error: 'Missing classId and counts/totalCount' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Confirm the student is actually enrolled in this class before letting
  // them build a test from its question bank.
  const { data: enrollment } = await admin
    .from('class_enrollments')
    .select('class_id')
    .eq('class_id', classId)
    .eq('student_id', caller.user.id)
    .maybeSingle()
  if (!enrollment) return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 })

  const { data: units } = await admin.from('units').select('id').eq('class_id', classId)
  const unitIds = (units ?? []).map(u => u.id)
  const { data: topics } = unitIds.length > 0
    ? await admin.from('topics').select('id').in('unit_id', unitIds)
    : { data: [] }
  let topicIdsInClass = (topics ?? []).map(t => t.id)
  if (topicIds && topicIds.length > 0) {
    const allowed = new Set(topicIdsInClass)
    topicIdsInClass = topicIds.filter(id => allowed.has(id))
  }
  if (topicIdsInClass.length === 0) return NextResponse.json({ error: 'No topics found for this class' }, { status: 404 })

  const CHUNK = 50
  let allQuestions: { id: string; difficulty: string | null; question_type: string }[] = []
  for (let i = 0; i < topicIdsInClass.length; i += CHUNK) {
    const chunk = topicIdsInClass.slice(i, i + CHUNK)
    const { data } = await admin.from('questions').select('id, difficulty, question_type').in('topic_id', chunk)
    allQuestions = allQuestions.concat(data ?? [])
  }

  const typeFiltered = !questionType || questionType === 'any'
    ? allQuestions
    : allQuestions.filter(q => q.question_type === questionType)

  function sample<T>(arr: T[], n: number): T[] {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, n)
  }

  let selected: string[] = []
  if (totalCount) {
    // Honors Chemistry path — no difficulty data, just a flat random sample.
    selected = sample(typeFiltered.map(q => q.id), totalCount)
  } else {
    for (const level of ['easy', 'medium', 'hard'] as const) {
      const want = counts?.[level] ?? 0
      if (want <= 0) continue
      const pool = typeFiltered.filter(q => q.difficulty === level).map(q => q.id)
      selected.push(...sample(pool, want))
    }
  }

  if (selected.length === 0) {
    return NextResponse.json({ error: 'No matching questions found — try different topics, question type, or difficulty counts' }, { status: 404 })
  }

  const { data: test, error } = await admin
    .from('practice_tests')
    .insert({
      student_id: caller.user.id,
      class_id: classId,
      title: title?.trim() || `Practice test — ${new Date().toLocaleDateString()}`,
      question_ids: selected,
      duration_minutes: durationMinutes || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('create-test error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ testId: test.id, questionCount: selected.length })
}
