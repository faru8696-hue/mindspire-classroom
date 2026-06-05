import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditor from './ProfileEditor'

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, avatar_url')
    .eq('id', session.user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">My Profile</h1>
      <ProfileEditor
        userId={session.user.id}
        initialFullName={profile.full_name ?? ''}
        initialNickname={profile.nickname ?? ''}
        initialAvatarUrl={profile.avatar_url ?? null}
      />
    </div>
  )
}
