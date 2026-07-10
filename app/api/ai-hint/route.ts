import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'
import { hintForStudentWork } from '@/lib/gemini'

// Student-facing: AI reads a snapshot of the student's own current work and
// gives one Socratic-style hint — guidance toward the next step, never the
// final answer.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { questionTitle, questionContent, boardImageDataUrl } = await req.json()
  if (!questionTitle || !boardImageDataUrl) {
    return NextResponse.json({ error: 'Missing questionTitle or boardImageDataUrl' }, { status: 400 })
  }

  try {
    const hint = await hintForStudentWork(questionTitle, questionContent ?? null, boardImageDataUrl)
    return NextResponse.json({ hint })
  } catch (err) {
    console.error('ai-hint error:', err)
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI hint failed: ${detail}` }, { status: 500 })
  }
}
