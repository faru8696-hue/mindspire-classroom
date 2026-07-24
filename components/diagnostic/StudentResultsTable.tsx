'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface StudentResultRow {
  attemptId: string
  leadId: string
  studentName: string
  studentEmail: string
  parentName: string
  parentPhone: string
  correctCount: number | null
  totalCount: number | null
  scorePct: number | null
  timeSpentMinutes: number
  submittedAt: string | null
}

export default function StudentResultsTable({ testId, rows }: { testId: string; rows: StudentResultRow[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function remove(row: StudentResultRow) {
    if (!window.confirm(`Permanently delete ${row.studentName}'s entry? This removes their contact info, attempt, and answers — it cannot be undone.`)) return
    setDeletingId(row.leadId)
    try {
      const res = await fetch('/api/diagnostic/admin/delete-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: row.leadId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Something went wrong.'); setDeletingId(null); return }
      router.refresh()
    } catch {
      alert('Connection error.')
      setDeletingId(null)
    }
  }

  if (rows.length === 0) {
    return <p className="text-gray-400 text-center py-8">No students have completed the test yet.</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-gray-400 text-xs uppercase tracking-wide">
          <th className="pb-2 px-3">Name</th>
          <th className="pb-2 px-3">Contact</th>
          <th className="pb-2 px-3">Score</th>
          <th className="pb-2 px-3">Time</th>
          <th className="pb-2 px-3">Date</th>
          <th className="pb-2 px-3"></th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          const pct = row.scorePct ?? 0
          const colorCls = pct >= 80 ? 'text-green-600 font-bold' : pct >= 50 ? 'text-yellow-600 font-bold' : 'text-red-600 font-bold'
          return (
            <tr key={row.attemptId} className="border-b hover:bg-gray-50">
              <td className="py-3 px-3 font-medium">{row.studentName}</td>
              <td className="py-3 px-3 text-gray-500 text-xs">
                {row.studentEmail}<br />
                <span className="text-gray-400">Parent: {row.parentName} · {row.parentPhone}</span>
              </td>
              <td className={`py-3 px-3 ${colorCls}`}>{row.correctCount}/{row.totalCount} ({pct}%)</td>
              <td className="py-3 px-3 text-gray-500 text-xs">{row.timeSpentMinutes}m</td>
              <td className="py-3 px-3 text-gray-400 text-xs">{row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : ''}</td>
              <td className="py-3 px-3 whitespace-nowrap">
                <Link href={`/teacher/diagnostics/${testId}/attempts/${row.attemptId}`} className="text-indigo-600 text-xs font-semibold hover:underline mr-3">View →</Link>
                <button onClick={() => remove(row)} disabled={deletingId === row.leadId}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-50">
                  {deletingId === row.leadId ? '…' : 'Delete'}
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
