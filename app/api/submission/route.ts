import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Returns a student's saved whiteboard for a question via service role.
// The submissions table has no working SELECT policy under RLS, so the teacher
// live board can't read it (or get realtime postgres_changes) as the client —
// it polls this instead. A teacher may read any student's work; a student may
// only read their own.
export async function GET(req: NextRequest) {
  const caller = await getCaller()
  if (!caller?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const questionId = req.nextUrl.searchParams.get('questionId')
  const studentId = req.nextUrl.searchParams.get('studentId')
  if (!questionId || !studentId) {
    return NextResponse.json({ error: 'Missing questionId or studentId' }, { status: 400 })
  }

  if (caller.profile?.role !== 'teacher' && caller.user.id !== studentId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('submissions')
    .select('canvas_data, updated_at')
    .eq('question_id', questionId)
    .eq('student_id', studentId)
    .maybeSingle()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    canvasData: data?.canvas_data ?? null,
    updatedAt: data?.updated_at ?? null,
  })
}
