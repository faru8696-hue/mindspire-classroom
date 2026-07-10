import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'
import { gradeStudentWork } from '@/lib/gemini'

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
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI check failed: ${detail}` }, { status: 500 })
  }
}
