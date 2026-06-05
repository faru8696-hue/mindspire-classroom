'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface AssignmentToast {
  id: string
  question_id: string
  class_id: string
  created_at: string
  question_title?: string
}

export default function StudentNotificationBell({ classIds }: { classIds: string[] }) {
  const supabase = createClient()
  const [toasts, setToasts] = useState<AssignmentToast[]>([])
  const [open, setOpen] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const seenIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (classIds.length === 0) return

    const channel = supabase
      .channel('student-assignments-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assignments', filter: `class_id=in.(${classIds.join(',')})` },
        async (payload) => {
          const row = payload.new as { id?: string; question_id: string; class_id: string; created_at: string }
          const toastId = row.question_id + ':' + row.class_id
          if (seenIds.current.has(toastId)) return
          seenIds.current.add(toastId)

          // Fetch question title
          const { data: q } = await supabase.from('questions').select('title').eq('id', row.question_id).single()
          const toast: AssignmentToast = {
            id: toastId,
            question_id: row.question_id,
            class_id: row.class_id,
            created_at: row.created_at,
            question_title: q?.title,
          }
          setToasts(prev => [toast, ...prev.slice(0, 9)])
          setNewCount(c => c + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [classIds.join(',')])

  function handleOpen() {
    setOpen(o => !o)
    setNewCount(0)
  }

  if (classIds.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-1.5 rounded-lg hover:bg-purple-800 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-purple-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {newCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
            {newCount > 9 ? '9+' : newCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">New Assignments</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
          {toasts.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-400 text-sm">No new assignments</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {toasts.map(t => (
                <Link
                  key={t.id}
                  href="/student/assignments"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-purple-50 transition-colors"
                >
                  <span className="text-purple-500 text-lg flex-shrink-0">📋</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">New question assigned</p>
                    <p className="text-xs text-gray-500 truncate">{t.question_title ?? 'A question was assigned to your class'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tap to view your assignments</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
