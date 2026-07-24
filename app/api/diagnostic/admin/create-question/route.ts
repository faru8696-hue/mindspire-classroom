import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { diagnosticTestId, topicId, content, options, correctIndex, imageUrl, source } = await req.json() as {
    diagnosticTestId?: string
    topicId?: string
    content?: string
    options?: string[]
    correctIndex?: number
    imageUrl?: string
    source?: string
  }

  if (!diagnosticTestId || !topicId || !content || !Array.isArray(options) || options.length < 2 || correctIndex === undefined) {
    return NextResponse.json({ error: 'diagnosticTestId, topicId, content, at least 2 options, and correctIndex are required.' }, { status: 400 })
  }
  if (correctIndex < 0 || correctIndex >= options.length) {
    return NextResponse.json({ error: 'correctIndex is out of range for the given options.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('diagnostic_questions')
    .insert({
      diagnostic_test_id: diagnosticTestId,
      topic_id: topicId,
      content,
      mcq_options: options,
      mcq_correct_index: correctIndex,
      image_url: imageUrl || null,
      source: source || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questionId: data.id })
}
