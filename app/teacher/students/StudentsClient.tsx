'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Student { id: string; full_name: string; email: string; avatar_url: string | null }
interface Class { id: string; title: string; order_index: number }

export default function StudentsClient({
  approved,
  classes,
  initialEnrollments,
}: {
  approved: Student[]
  classes: Class[]
  initialEnrollments: { student_id: string; class_id: string }[]
}) {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<{ student_id: string; class_id: string }[]>(initialEnrollments)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function enroll(studentId: string, classId: string) {
    if (!classId) return
    setLoading(`enroll-${studentId}`)
    setError(null)
    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, classId, action: 'enroll' }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to enroll')
    } else {
      setEnrollments(prev => [...prev, { student_id: studentId, class_id: classId }])
    }
    setLoading(null)
  }

  async function unenroll(studentId: string, classId: string) {
    setLoading(`unenroll-${studentId}-${classId}`)
    setError(null)
    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, classId, action: 'unenroll' }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to unenroll')
    } else {
      setEnrollments(prev => prev.filter(e => !(e.student_id === studentId && e.class_id === classId)))
    }
    setLoading(null)
  }

  async function removeStudent(studentId: string) {
    setLoading(`remove-${studentId}`)
    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, classId: null, action: 'remove' }),
    })
    if (res.ok) router.refresh()
    setLoading(null)
  }

  async function deleteStudent(studentId: string, name: string) {
    if (!confirm(`Permanently delete ${name}? This will remove all their submissions, grades, and account data. This cannot be undone.`)) return
    setLoading(`delete-${studentId}`)
    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, action: 'delete' }),
    })
    if (res.ok) router.refresh()
    setLoading(null)
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-3">
          ⚠️ {error}
        </div>
      )}
      {approved.map(student => {
        const enrolledClassIds = enrollments.filter(e => e.student_id === student.id).map(e => e.class_id)
        const enrolledClasses = classes.filter(c => enrolledClassIds.includes(c.id))
        const unenrolledClasses = classes.filter(c => !enrolledClassIds.includes(c.id))

        return (
          <div key={student.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {student.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600 flex-shrink-0">
                  {(student.full_name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <Link href={`/teacher/students/${student.id}`} className="font-semibold text-gray-800 hover:text-purple-700 hover:underline">
                  {student.full_name}
                </Link>
                <p className="text-sm text-gray-500">{student.email}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {enrolledClasses.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No classes</span>
                  ) : enrolledClasses.map(c => (
                    <button
                      key={c.id}
                      onClick={() => unenroll(student.id, c.id)}
                      disabled={loading === `unenroll-${student.id}-${c.id}`}
                      className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors group disabled:opacity-50"
                    >
                      {c.title}
                      <span className="text-purple-400 group-hover:text-red-500">✕</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {unenrolledClasses.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    id={`select-${student.id}`}
                    defaultValue=""
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="">Add to class...</option>
                    {unenrolledClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const sel = document.getElementById(`select-${student.id}`) as HTMLSelectElement
                      enroll(student.id, sel.value)
                      sel.value = ''
                    }}
                    disabled={loading === `enroll-${student.id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading === `enroll-${student.id}` ? '...' : 'Add'}
                  </button>
                </div>
              )}
              <button
                onClick={() => removeStudent(student.id)}
                disabled={loading === `remove-${student.id}`}
                className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Remove
              </button>
              <button
                onClick={() => deleteStudent(student.id, student.full_name)}
                disabled={loading === `delete-${student.id}`}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === `delete-${student.id}` ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
