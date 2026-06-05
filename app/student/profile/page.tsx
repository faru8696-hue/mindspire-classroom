import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditor from './ProfileEditor'

export default async function StudentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>
}) {
  const { required } = await searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, avatar_url, grade_level, phone, parent_name, parent_phone, email')
    .eq('id', session.user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="max-w-lg mx-auto">
      {required === '1' && (
        <div className="mb-5 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium">
          📋 Please complete your profile before continuing. All fields below are required.
        </div>
      )}
      <h1 className="text-2xl font-bold text-purple-900 mb-6">My Profile</h1>
      <ProfileEditor
        userId={session.user.id}
        email={profile.email ?? session.user.email ?? ''}
        initialFullName={profile.full_name ?? ''}
        initialNickname={profile.nickname ?? ''}
        initialAvatarUrl={profile.avatar_url ?? null}
        initialGradeLevel={(profile as { grade_level?: string }).grade_level ?? ''}
        initialPhone={(profile as { phone?: string }).phone ?? ''}
        initialParentName={(profile as { parent_name?: string }).parent_name ?? ''}
        initialParentPhone={(profile as { parent_phone?: string }).parent_phone ?? ''}
      />
    </div>
  )
}
