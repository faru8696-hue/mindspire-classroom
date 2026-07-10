import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'
import { chatSocratic, ChatTurn } from '@/lib/gemini'

// Student-facing Socratic tutor chat. The AI only ever asks guiding
// questions toward the next step — see the system instruction in
// lib/gemini.ts for the actual behavior rules.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { questionTitle, questionContent, boardImageDataUrl, history } = await req.json()
  if (!questionTitle || !Array.isArray(history) || history.length === 0) {
    return NextResponse.json({ error: 'Missing questionTitle or history' }, { status: 400 })
  }

  try {
    const reply = await chatSocratic(
      questionTitle,
      questionContent ?? null,
      boardImageDataUrl ?? null,
      history as ChatTurn[],
    )
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('ai-chat error:', err)
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI tutor failed: ${detail}` }, { status: 500 })
  }
}
