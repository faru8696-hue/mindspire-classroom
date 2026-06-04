import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function approveStudent(formData: FormData) {
  'use server'
  const supabase = await createClient()
  await supabase.from('profiles').update({
    approved: true,
    class_id: formData.get('class_id') as string || null,
  }).eq('id', formData.get('id') as string)
  revalidatePath('/teacher/students')
}

async function assignClass(formData: FormData) {
  'use server'
  const supabase = await createClient()
  await supabase.from('profiles').update({
    class_id: formData.get('class_id') as string || null,
  }).eq('id', formData.get('id') as string)
  revalidatePath('/teacher/students')
}

async function removeStudent(formData: FormData) {
  'use server'
  const supabase = await createClient()
  await supabase.from('profiles').update({ approved: false, class_id: null }).eq('id', formData.get('id') as string)
  revalidatePath('/teacher/students')
}

export default async function StudentsPage() {
  const admin = await createAdminClient()

  const [{ data: pending }, { data: approved }, { data: classes }] = await Promise.all([
    admin.from('profiles').select('*').eq('role', 'student').eq('approved', false).order('created_at'),
    admin.from('profiles').select('*').eq('role', 'student').eq('approved', true).order('full_name'),
    admin.from('classes').select('*').order('order_index'),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">Students</h1>

      {(pending?.length ?? 0) > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-amber-700 mb-3">⏳ Waiting for Approval ({pending!.length})</h2>
          <div className="space-y-2">
            {pending!.map((student) => (
              <div key={student.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{student.full_name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
                <form action={approveStudent} className="flex items-center gap-2 flex-wrap">
                  <input type="hidden" name="id" value={student.id} />
                  <select name="class_id" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="">Assign to class...</option>
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
          <div className="space-y-2">
            {approved.map((student) => (
              <div key={student.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{student.full_name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                  <p className="text-xs text-purple-600 mt-0.5 font-medium">
                    {classes?.find(c => c.id === student.class_id)?.title ?? 'No class assigned'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <form action={assignClass} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={student.id} />
                    <select name="class_id" defaultValue={student.class_id ?? ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                      <option value="">No class</option>
                      {classes?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded-lg transition-colors">
                      Save
                    </button>
                  </form>
                  <form action={removeStudent}>
                    <input type="hidden" name="id" value={student.id} />
                    <button className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-2 rounded-lg transition-colors">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
