import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StudentsClient from './StudentsClient'

async function approveStudent(formData: FormData) {
  'use server'
  const admin = await createAdminClient()
  const id = formData.get('id') as string
  const classId = formData.get('class_id') as string
  await admin.from('profiles').update({ approved: true }).eq('id', id)
  if (classId) {
    await admin.from('class_enrollments').upsert({ student_id: id, class_id: classId })
  }
  redirect('/teacher/students')
}

export default async function StudentsPage() {
  const admin = await createAdminClient()

  const [{ data: pending }, { data: approved }, { data: classes }, { data: allEnrollments }] = await Promise.all([
    admin.from('profiles').select('*').eq('role', 'student').eq('approved', false).order('created_at'),
    admin.from('profiles').select('*').eq('role', 'student').eq('approved', true).order('full_name'),
    admin.from('classes').select('*').order('order_index'),
    admin.from('class_enrollments').select('student_id, class_id'),
  ])

  // Build map: student_id → class_id[]
  const enrollmentMap = new Map<string, string[]>()
  for (const e of allEnrollments ?? []) {
    const arr = enrollmentMap.get(e.student_id) ?? []
    arr.push(e.class_id)
    enrollmentMap.set(e.student_id, arr)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">Students</h1>

      {(pending?.length ?? 0) > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-amber-700 mb-3">⏳ Waiting for Approval ({pending!.length})</h2>
          <div className="space-y-2">
            {pending!.map((student) => (
              <div key={student.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {student.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={student.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-amber-200 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-600 flex-shrink-0">
                      {(student.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{student.full_name}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
                <form action={approveStudent} className="flex items-center gap-2 flex-wrap">
                  <input type="hidden" name="id" value={student.id} />
                  <select name="class_id" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="">Assign to class (optional)...</option>
                    {classes?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                    Approve
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-green-700 mb-3">✅ Active Students ({approved?.length ?? 0})</h2>
        {!approved?.length ? (
          <p className="text-gray-500">No approved students yet.</p>
        ) : (
          <StudentsClient
            approved={(approved ?? []).map(s => ({ id: s.id, full_name: s.full_name, email: s.email, avatar_url: s.avatar_url }))}
            classes={classes ?? []}
            initialEnrollments={allEnrollments ?? []}
          />
        )}
      </div>
    </div>
  )
}
