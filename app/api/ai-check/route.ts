import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'
import { gradeStudentWork } from '@/lib/gemini'
import { isQuotaExceeded, isOverloaded } from '@/lib/geminiErrors'

// Teacher-only: AI reads a snapshot of a student's board and suggests a
// grade + feedback. This is a SUGGESTION — the teacher still has to click
// Correct/Wrong themselves for it to actually save and notify the student.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { questionTitle, questionContent, boardImageDataUrl } = await req.json()
  if (!questionTitle || !boardImageDataUrl) {
    return NextResponse.json({ error: 'Missing questionTitle or boardImageDataUrl' }, { status: 400 })
  }

  try {
    const result = await gradeStudentWork(questionTitle, questionContent ?? null, boardImageDataUrl)
    return NextResponse.json(result)
  } catch (err) {
    console.error('ai-check error:', err)
    const message = err instanceof Error ? err.message : String(err)
    if (isQuotaExceeded(message)) {
      return NextResponse.json({ error: 'AI check: daily limit reached. Try again tomorrow.' }, { status: 429 })
    }
    return NextResponse.json(
      { error: isOverloaded(message) ? 'AI check is not available right now. Please try again in a bit.' : `AI check failed: ${message}` },
      { status: 503 }
    )
  }
}
