import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: profile } = await supabase
    .from('profiles')
    .select('class_id')
    .eq('id', session!.user.id)
    .single()

  if (profile?.class_id) {
    redirect(`/student/${profile.class_id}`)
  }

  return (
    <div className="max-w-3xl mx-auto flex items-center justify-center min-h-96">
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-xl font-bold text-purple-900 mb-2">No Class Assigned Yet</h2>
        <p className="text-gray-500">Your teacher hasn't assigned you to a class yet. Check back soon!</p>
      </div>
    </div>
  )
}
