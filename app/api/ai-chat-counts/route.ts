import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: message counts per student for a question, so the live grid
// can badge which students have used AI Faridah without fetching every full
// transcript up front.
export async function GET(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const questionId = req.nextUrl.searchParams.get('questionId')
  if (!questionId) {
    return NextResponse.json({ error: 'Missing questionId' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('ai_chat_messages')
    .select('student_id')
    .eq('question_id', questionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const countByStudent: Record<string, number> = {}
  for (const row of data ?? []) {
    countByStudent[row.student_id] = (countByStudent[row.student_id] ?? 0) + 1
  }
  return NextResponse.json({ countByStudent })
}
