import { NextRequest, NextResponse } from 'next/server'
import { getCaller, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { diagnosticTestId, title, prepAdvice } = await req.json()
  if (!diagnosticTestId || !title) {
    return NextResponse.json({ error: 'diagnosticTestId and title are required.' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('diagnostic_topics')
    .insert({ diagnostic_test_id: diagnosticTestId, title, prep_advice: prepAdvice || null })
    .select('id')
    .single()

  if (error) {
    const message = error.code === '23505' ? 'A topic with that title already exists for this test.' : error.message
    return NextResponse.json({ error: message }, { status: error.code === '23505' ? 409 : 500 })
  }
  return NextResponse.json({ topicId: data.id })
}
