import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ProfileEditor from './ProfileEditor'

function adminDb() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function StudentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>
}) {
  const { required } = await searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const studentId = session.user.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, avatar_url, grade_level, phone, parent_name, parent_phone, email')
    .eq('id', studentId)
    .single()

  if (!profile) redirect('/login')

  // Separate query for parent_email — it may not exist yet if the migration
  // (add-parent-email.sql) hasn't been run, and a missing column would make
  // the whole combined select above error out and redirect everyone to login.
  const { data: extProfile } = await supabase
    .from('profiles')
    .select('parent_email')
    .eq('id', studentId)
    .maybeSingle()
  const parentEmail = (extProfile as { parent_email?: string } | null)?.parent_email ?? ''

  // Stats
  const admin = adminDb()
  const { data: enrollments } = await admin.from('class_enrollments').select('class_id, classes(id, title)').eq('student_id', studentId)
  const enrolledClasses = (enrollments ?? []).map((e: { class_id: string; classes: { id: string; title: string } | { id: string; title: string }[] | null }) => {
    const c = e.classes; return Array.isArray(c) ? c[0] : c
  }).filter(Boolean) as { id: string; title: string }[]

  const classIds = enrolledClasses.map(c => c.id)
  const { data: classAssignments } = classIds.length > 0
    ? await admin.from('assignments').select('question_id').in('class_id', classIds)
    : { data: [] }
  const { data: studentAssignments } = await admin.from('student_assignments').select('question_id').eq('student_id', studentId)
  const totalAssigned = new Set([
    ...(classAssignments ?? []).map((a: { question_id: string }) => a.question_id),
    ...(studentAssignments ?? []).map((a: { question_id: string }) => a.question_id),
  ]).size

  const { data: submissions } = await admin.from('submissions').select('id').eq('student_id', studentId)
  const submissionIds = (submissions ?? []).map((s: { id: string }) => s.id)
  const { data: feedbacks } = submissionIds.length > 0
    ? await admin.from('feedback').select('grade').in('submission_id', submissionIds)
    : { data: [] }

  const totalSubmitted = submissions?.length ?? 0
  const totalCorrect = (feedbacks ?? []).filter((f: { grade: string | null }) => f.grade === 'correct').length
  const pct = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0

  return (
    <div className="max-w-lg mx-auto">
      {required === '1' && (
        <div className="mb-5 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium">
          📋 Please complete your profile before continuing. All fields below are required.
        </div>
      )}
      <h1 className="text-2xl font-bold text-purple-900 mb-6">My Profile</h1>

      {/* Stats */}
      {totalAssigned > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">My Progress</h2>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-700">{totalSubmitted}</p>
              <p className="text-xs text-gray-500 mt-0.5">Submitted</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">{totalCorrect}</p>
              <p className="text-xs text-gray-500 mt-0.5">Correct</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-purple-600">{pct}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Complete</p>
            </div>
          </div>
          {enrolledClasses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Enrolled in</p>
              <div className="flex flex-wrap gap-2">
                {enrolledClasses.map(c => (
                  <span key={c.id} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">{c.title}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
        initialParentEmail={parentEmail}
      />
    </div>
  )
}
