import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

// Teacher-only: edits a question in place, including moving it to a
// different topic and relabeling its source ("worksheet"). questions is a
// single shared row referenced by every student's submission, so this
// automatically applies everywhere the question appears — no per-student
// copies to keep in sync.
export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { questionId, title, content, topicId, source } = await req.json() as {
    questionId?: string; title?: string; content?: string; topicId?: string; source?: string
  }
  if (!questionId || !title || !topicId) {
    return NextResponse.json({ error: 'questionId, title, and topicId are required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('questions')
    .update({
      title,
      content: content || null,
      topic_id: topicId,
      source: source || null,
    })
    .eq('id', questionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
