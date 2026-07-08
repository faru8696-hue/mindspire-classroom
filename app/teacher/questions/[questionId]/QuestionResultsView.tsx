'use client'

import { useState } from 'react'
import Link from 'next/link'
import MiniBoard from '@/components/MiniBoard'

interface Part { id: string; title: string; content: string | null; order_index: number }
interface Student { id: string; full_name: string; avatar_url: string | null; nickname: string | null }
interface Submission { id: string; student_id: string; question_id: string; canvas_data: string | null; text_answer: string | null; updated_at: string }
interface Feedback { submission_id: string; grade: string | null }

interface Props {
  classId: string
  classTitle: string
  topic: { id: string; title: string }
  parts: Part[]
  activeQuestionId: string
  students: Student[]
  submissions: Submission[]
  feedbacks: Feedback[]
}

const GRADE_BORDER: Record<string, string> = {
  correct:   'border-green-400',
  partial:   'border-amber-400',
  incorrect: 'border-red-400',
  discussed: 'border-blue-400',
  needsmore: 'border-purple-400',
}
const GRADE_BADGE: Record<string, string> = {
  correct:   'bg-green-500',
  partial:   'bg-amber-500',
  incorrect: 'bg-red-500',
  discussed: 'bg-blue-500',
  needsmore: 'bg-purple-500',
}
const GRADE_LABEL: Record<string, string> = {
  correct: '✓', partial: '~', incorrect: '✗', discussed: '💬', needsmore: '🔄',
}

export default function QuestionResultsView({
  classId, classTitle, topic, parts, activeQuestionId,
  students, submissions, feedbacks,
}: Props) {
  const [selectedPartId, setSelectedPartId] = useState(activeQuestionId)

  const selectedPart = parts.find(p => p.id === selectedPartId) ?? parts[0]

  // Build lookups
  const gradeBySubId = new Map(feedbacks.map(f => [f.submission_id, f.grade]))
  // key: `${studentId}:${questionId}` → submission
  const subMap = new Map(submissions.map(s => [`${s.student_id}:${s.question_id}`, s]))

  const submitted = students.filter(s => subMap.has(`${s.id}:${selectedPartId}`)).length
  const total = students.length

  return (
    <div className="space-y-5">
      {/* Topic header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">{classTitle}</p>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
              {topic.title}
            </h1>
            {parts.length > 1 && (
              <p className="text-sm text-gray-500 mt-1">{parts.length}-part problem</p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm flex-shrink-0">
            <span className="text-gray-500">{submitted}/{total} submitted</span>
            <Link
              href={`/teacher/live/${classId}/${selectedPartId}`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Go Live →
            </Link>
          </div>
        </div>

        {/* Part tabs — only shown when there are multiple parts */}
        {parts.length > 1 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {parts.map((part, i) => {
              const partSubs = students.filter(s => subMap.has(`${s.id}:${part.id}`)).length
              const isActive = part.id === selectedPartId
              return (
                <button
                  key={part.id}
                  onClick={() => setSelectedPartId(part.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700'
                  }`}
                >
                  Part {String.fromCharCode(97 + i)}
                  <span className={`ml-1.5 text-xs ${isActive ? 'text-purple-200' : 'text-gray-400'}`}>
                    {partSubs}/{total}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected part question text */}
      {selectedPart && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
            {parts.length > 1
              ? `Part ${String.fromCharCode(97 + parts.indexOf(selectedPart))}`
              : 'Question'}
          </p>
          <p className="text-[15px] font-semibold text-gray-900 leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
            {selectedPart.title}
          </p>
          {selectedPart.content && (
            <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Georgia, serif' }}>
              {selectedPart.content}
            </p>
          )}
        </div>
      )}

      {/* Student grid */}
      {students.length === 0 ? (
        <p className="text-gray-500 text-sm">No students enrolled in this class.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {students.map(student => {
            const sub = subMap.get(`${student.id}:${selectedPartId}`)
            const grade = sub ? gradeBySubId.get(sub.id) ?? null : null
            const displayName = student.nickname || student.full_name

            return (
              <Link
                key={student.id}
                href={`/teacher/live/${classId}/${selectedPartId}/${student.id}`}
                className={`flex flex-col rounded-xl border-2 overflow-hidden hover:scale-105 hover:shadow-lg transition-all bg-white ${
                  grade ? GRADE_BORDER[grade] : sub ? 'border-blue-300' : 'border-gray-200'
                }`}
              >
                {/* Work thumbnail */}
                <div className="w-full aspect-video bg-gray-50 relative overflow-hidden">
                  {sub?.text_answer && !sub?.canvas_data ? (
                    <div className="p-2 text-xs text-gray-500 overflow-hidden h-full line-clamp-4">{sub.text_answer}</div>
                  ) : (
                    <MiniBoard canvasData={sub?.canvas_data ?? null} />
                  )}
                  {grade && (
                    <span className={`absolute bottom-1 right-1 text-xs px-1.5 py-0.5 rounded font-bold text-white ${GRADE_BADGE[grade]}`}>
                      {GRADE_LABEL[grade]}
                    </span>
                  )}
                </div>

                {/* Name row */}
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  {student.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={student.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-700 truncate">{displayName}</span>
                </div>

                {/* Per-part progress dots for multi-part problems */}
                {parts.length > 1 && (
                  <div className="flex gap-1 px-2 pb-1.5">
                    {parts.map((part, i) => {
                      const partSub = subMap.get(`${student.id}:${part.id}`)
                      const partGrade = partSub ? gradeBySubId.get(partSub.id) ?? null : null
                      return (
                        <span
                          key={part.id}
                          title={`Part ${String.fromCharCode(97 + i)}`}
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            partGrade === 'correct'   ? 'bg-green-500' :
                            partGrade === 'incorrect' ? 'bg-red-400' :
                            partGrade === 'partial'   ? 'bg-amber-400' :
                            partSub                   ? 'bg-blue-400' :
                                                        'bg-gray-200'
                          }`}
                        />
                      )
                    })}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
