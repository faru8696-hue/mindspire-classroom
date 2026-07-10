import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'
import { chatSocratic, ChatTurn } from '@/lib/gemini'

// Student-facing Socratic tutor chat. The AI only ever asks guiding
// questions toward the next step — see the system instruction in
// lib/gemini.ts for the actual behavior rules. Every turn is persisted to
// ai_chat_messages so a teacher can review the transcript later.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { questionId, studentId, questionTitle, questionContent, boardImageDataUrl, history } = await req.json()
  if (!questionId || !studentId || !questionTitle || !Array.isArray(history) || history.length === 0) {
    return NextResponse.json({ error: 'Missing questionId, studentId, questionTitle, or history' }, { status: 400 })
  }

  try {
    const reply = await chatSocratic(
      questionTitle,
      questionContent ?? null,
      boardImageDataUrl ?? null,
      history as ChatTurn[],
    )

    const admin = await createAdminClient()
    const lastUserTurn = history[history.length - 1] as ChatTurn
    await admin.from('ai_chat_messages').insert([
      { question_id: questionId, student_id: studentId, role: 'user', message: lastUserTurn.text },
      { question_id: questionId, student_id: studentId, role: 'model', message: reply },
    ])

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('ai-chat error:', err)
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ error: 'AI Faridah: daily limit reached. Try again tomorrow.' }, { status: 429 })
    }
    const unavailable = message.includes('503') || message.includes('UNAVAILABLE')
    return NextResponse.json(
      { error: unavailable ? 'AI Faridah is not available right now. Please try again in a bit.' : `AI Faridah failed: ${message}` },
      { status: 503 }
    )
  }
}
