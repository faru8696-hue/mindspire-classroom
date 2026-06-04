import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Live classroom pages are full-screen — they have their own header, no nav bar
export default async function LiveLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()
  if (!profile || profile.role !== 'teacher') redirect('/')

  return <>{children}</>
}
