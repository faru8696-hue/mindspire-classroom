'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface PracticeTestListRowProps {
  testId: string
  studentDisplayName: string
  title: string
  classTitle: string
  completed: boolean
  pct: number | null
  scoreColor: string
  earned: number
  total: number
  gradedCount: number
  totalQuestions: number
  questionCount: number
  durationMinutes: number | null
  createdAt: string
}

export default function PracticeTestListRow({
  testId, studentDisplayName, title, classTitle, completed, pct, scoreColor,
  earned, total, gradedCount, totalQuestions, questionCount, durationMinutes, createdAt,
}: PracticeTestListRowProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function remove() {
    if (!window.confirm(`Permanently delete ${studentDisplayName}'s "${title}" self-study test? This removes the test and their answers — it cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/practice/admin/delete-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Something went wrong.'); setDeleting(false); return }
      router.refresh()
    } catch {
      alert('Connection error.')
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-purple-300 transition-colors gap-3">
      <Link href={`/teacher/practice-tests/${testId}`} className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800">{studentDisplayName}</p>
        <p className="text-xs text-gray-400">{title} · {classTitle}</p>
      </Link>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center justify-end gap-2 mb-0.5">
          {completed && pct !== null ? (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>{earned}/{total} pts · {pct}%</span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
              {gradedCount > 0 ? `In progress (${gradedCount}/${totalQuestions})` : 'Not started'}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{questionCount} questions{durationMinutes ? ` · ${durationMinutes} min` : ''}</p>
        <p className="text-xs text-gray-400">{new Date(createdAt).toLocaleString()}</p>
      </div>
      <button
        onClick={remove}
        disabled={deleting}
        title="Delete this self-study test"
        className="text-red-400 hover:text-red-600 text-xs font-semibold disabled:opacity-50 flex-shrink-0"
      >
        {deleting ? '…' : 'Delete'}
      </button>
    </div>
  )
}
