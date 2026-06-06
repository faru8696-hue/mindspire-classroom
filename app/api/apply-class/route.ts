import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId, classId } = await req.json()
  if (!userId || !classId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Retry a few times — profile may not exist immediately after signUp
  for (let i = 0; i < 5; i++) {
    const { error } = await admin
      .from('profiles')
      .update({ pending_class_id: classId })
      .eq('id', userId)
    if (!error) return NextResponse.json({ ok: true })
    await new Promise(r => setTimeout(r, 600))
  }

  return NextResponse.json({ error: 'Profile not ready yet' }, { status: 500 })
}
