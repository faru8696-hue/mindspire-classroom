'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export interface LiveQuestionInfo {
  classId: string
  classTitle: string
  questionId: string
  unitId: string
  topicId: string
  title: string
}

export default function LiveQuestionBanner({
  classes, initialLiveQuestions,
}: {
  classes: { id: string; title: string }[]
  initialLiveQuestions: LiveQuestionInfo[]
}) {
  const [live, setLive] = useState<Map<string, LiveQuestionInfo>>(
    () => new Map(initialLiveQuestions.map(l => [l.classId, l]))
  )

  // One channel per enrolled class (not just the currently-live ones) so a
  // push that starts after this page already loaded is still picked up.
  useEffect(() => {
    const supabase = createClient()
    const channels = classes.map(c => {
      const ch = supabase.channel(`live-question:${c.id}`)
      ch.on('broadcast', { event: 'question-changed' }, ({ payload }) => {
        const incoming = payload as { questionId: string | null; unitId?: string; topicId?: string; title?: string }
        setLive(prev => {
          const next = new Map(prev)
          if (!incoming.questionId) { next.delete(c.id); return next }
          next.set(c.id, {
            classId: c.id, classTitle: c.title, questionId: incoming.questionId,
            unitId: incoming.unitId ?? '', topicId: incoming.topicId ?? '', title: incoming.title ?? '',
          })
          return next
        })
      })
      ch.subscribe()
      return ch
    })
    return () => { channels.forEach(ch => supabase.removeChannel(ch)) }
  }, [classes])

  const entries = [...live.values()]
  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-2 mb-4">
      {entries.map(l => (
        <Link
          key={l.classId}
          href={`/student/${l.classId}/${l.unitId}/${l.topicId}/${l.questionId}`}
          className="flex items-center justify-between gap-3 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 shadow-lg transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            LIVE now in {l.classTitle}: {l.title}
          </span>
          <span className="text-xs font-bold underline flex-shrink-0">Join →</span>
        </Link>
      ))}
    </div>
  )
}
