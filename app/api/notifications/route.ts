import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getCaller } from '@/lib/supabase/server'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const admin = adminClient()
  const { data, error } = await admin
    .from('notifications')
    .select('id, type, student_id, question_id, class_id, created_at, read, profiles:profiles!notifications_student_id_fkey(full_name), questions:questions!notifications_question_id_fkey(title)')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ notifications: [] })

  const notifications = (data ?? []).map((n: {
    id: string; type: string; student_id: string; question_id: string; class_id: string;
    created_at: string; read: boolean;
    profiles: { full_name: string }[] | { full_name: string } | null;
    questions: { title: string }[] | { title: string } | null;
  }) => ({
    id: n.id,
    type: n.type,
    student_id: n.student_id,
    question_id: n.question_id,
    class_id: n.class_id,
    created_at: n.created_at,
    read: n.read,
    student_name: Array.isArray(n.profiles) ? n.profiles[0]?.full_name : (n.profiles as { full_name: string } | null)?.full_name,
    question_title: Array.isArray(n.questions) ? n.questions[0]?.title : (n.questions as { title: string } | null)?.title,
  }))

  return NextResponse.json({ notifications })
}

export async function POST(req: Request) {
  const caller = await getCaller()
  if (caller?.profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { ids } = await req.json()
  if (!ids?.length) return NextResponse.json({ ok: true })
  const admin = adminClient()
  await admin.from('notifications').update({ read: true }).in('id', ids)
  return NextResponse.json({ ok: true })
}
