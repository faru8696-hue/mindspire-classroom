import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { classifyQuestionDifficulty } from '@/lib/gemini'

// Teacher-only: labels a single newly-added question with a difficulty
// (easy/medium/hard) and point value, the same rubric used by the one-off
// bulk audit — called right after a question is created so it's never left
// unclassified waiting on the next manual bulk run. Honors Chemistry
// questions are skipped (that class deliberately has no difficulty data —
// see the self-study test builder, which shows a flat count picker for it
// instead of an easy/medium/hard split).
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { questionId } = await req.json() as { questionId: string }
  if (!questionId) return NextResponse.json({ error: 'Missing questionId' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: question } = await admin
    .from('questions')
    .select('id, title, content, answer_key, topic_id')
    .eq('id', questionId)
    .maybeSingle()
  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  const { data: topic } = await admin.from('topics').select('unit_id').eq('id', question.topic_id).maybeSingle()
  const { data: unit } = topic ? await admin.from('units').select('class_id').eq('id', topic.unit_id).maybeSingle() : { data: null }
  const { data: cls } = unit ? await admin.from('classes').select('title').eq('id', unit.class_id).maybeSingle() : { data: null }

  if (cls && /honors/i.test(cls.title)) {
    return NextResponse.json({ skipped: true, reason: 'Honors Chemistry does not use difficulty labels' })
  }

  try {
    const { difficulty, points } = await classifyQuestionDifficulty(question.title, question.content, question.answer_key)
    await admin.from('questions').update({ difficulty, points }).eq('id', questionId)
    return NextResponse.json({ difficulty, points })
  } catch (err) {
    console.error('classify-question error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Classification failed' }, { status: 500 })
  }
}
