import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { generateAnswerKey } from '@/lib/gemini'
import { isQuotaExceeded, isOverloaded } from '@/lib/geminiErrors'

// Teacher-only: (re)generates the AI draft answer key for one question and
// saves it. Always overwritable — this is a starting point for the teacher
// to review/edit, not a locked-in answer.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { questionId } = await req.json()
  if (!questionId) {
    return NextResponse.json({ error: 'Missing questionId' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data: question, error: fetchError } = await admin
    .from('questions')
    .select('title, content, image_url')
    .eq('id', questionId)
    .single()

  if (fetchError || !question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  try {
    const answerKey = await generateAnswerKey(question.title, question.content, question.image_url)
    const { error: updateError } = await admin.from('questions').update({ answer_key: answerKey }).eq('id', questionId)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json({ answerKey })
  } catch (err) {
    console.error('generate-answer-key error:', err)
    const message = err instanceof Error ? err.message : String(err)
    if (isQuotaExceeded(message)) {
      return NextResponse.json({ error: 'Daily AI limit reached. Try again tomorrow.' }, { status: 429 })
    }
    return NextResponse.json(
      { error: isOverloaded(message) ? 'AI is not available right now. Please try again in a bit.' : `Answer key generation failed: ${message}` },
      { status: 503 }
    )
  }
}
