import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { diagnosticTestId, topicId, content, questionType, options, correctIndex, imageUrl, source, explanation, answerKey, points } = await req.json() as {
    diagnosticTestId?: string
    topicId?: string
    content?: string
    questionType?: 'mcq' | 'frq'
    options?: string[]
    correctIndex?: number
    imageUrl?: string
    source?: string
    explanation?: string
    answerKey?: string
    points?: number
  }

  if (!diagnosticTestId || !topicId || !content) {
    return NextResponse.json({ error: 'diagnosticTestId, topicId, and content are required.' }, { status: 400 })
  }
  const type = questionType === 'frq' ? 'frq' : 'mcq'
  if (type === 'mcq') {
    if (!Array.isArray(options) || options.length < 2 || correctIndex === undefined) {
      return NextResponse.json({ error: 'At least 2 options and correctIndex are required for MCQ questions.' }, { status: 400 })
    }
    if (correctIndex < 0 || correctIndex >= options.length) {
      return NextResponse.json({ error: 'correctIndex is out of range for the given options.' }, { status: 400 })
    }
  } else if (!points || points <= 0) {
    return NextResponse.json({ error: 'points (total possible score) is required for FRQ questions.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('diagnostic_questions')
    .insert({
      diagnostic_test_id: diagnosticTestId,
      topic_id: topicId,
      content,
      question_type: type,
      mcq_options: type === 'mcq' ? options : null,
      mcq_correct_index: type === 'mcq' ? correctIndex : null,
      image_url: imageUrl || null,
      source: source || null,
      explanation: type === 'mcq' ? (explanation || null) : null,
      answer_key: type === 'frq' ? (answerKey || null) : null,
      points: type === 'frq' ? points : null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questionId: data.id })
}
