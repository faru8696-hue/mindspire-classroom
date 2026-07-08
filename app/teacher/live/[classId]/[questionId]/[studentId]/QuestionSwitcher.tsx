'use client'

import { useState } from 'react'

interface Q {
  id: string
  title: string
  topicTitle: string
  status: 'none' | 'submitted' | 'graded'
}

interface Props {
  classId: string
  studentId: string
  questionId: string
  questionTitle: string
  questions: Q[]
}

const STATUS_DOT: Record<Q['status'], string> = {
  none: 'bg-gray-600',
  submitted: 'bg-blue-400',
  graded: 'bg-green-400',
}

export default function QuestionSwitcher({ classId, studentId, questionId, questionTitle, questions }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 hover:bg-gray-800 rounded-lg px-2 py-1 -mx-2 transition-colors min-w-0"
      >
        <h2 className="text-white font-semibold text-lg leading-relaxed truncate">{questionTitle}</h2>
        <span className="text-gray-400 flex-shrink-0">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-96 max-h-[60vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 py-1">
            <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-800 sticky top-0 bg-gray-900">
              Jump to another question — same student
            </p>
            {questions.map(q => {
              const isCurrent = q.id === questionId
              return (
                <button
                  key={q.id}
                  onClick={() => { if (!isCurrent) window.location.href = `/teacher/live/${classId}/${q.id}/${studentId}` }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${isCurrent ? 'bg-purple-600/20' : 'hover:bg-gray-800'}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[q.status]}`} title={q.status} />
                  <div className="min-w-0 flex-1">
                    {q.topicTitle && <p className="text-[10px] text-gray-500 truncate">{q.topicTitle}</p>}
                    <p className={`text-xs font-medium truncate ${isCurrent ? 'text-purple-300' : 'text-gray-200'}`}>
                      {isCurrent && '● '}{q.title}
                    </p>
                  </div>
                </button>
              )
            })}
            {questions.length === 0 && (
              <p className="px-3 py-4 text-xs text-gray-500">No other questions in this class yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
