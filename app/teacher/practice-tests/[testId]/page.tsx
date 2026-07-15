import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QuestionContent from '@/components/QuestionContent'
import AnswerKeyText from '@/components/AnswerKeyText'

const GRADE_BADGE: Record<string, { label: string; cls: string }> = {
  correct:   { label: '✓ Correct',   cls: 'bg-green-100 text-green-700' },
  incorrect: { label: '✗ Incorrect', cls: 'bg-red-100 text-red-600' },
}

export default async function PracticeTestDetailPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params
  const admin = await createAdminClient()

  const { data: test } = await admin
    .from('practice_tests')
    .select('id, title, student_id, class_id, question_ids, duration_minutes, created_at')
    .eq('id', testId)
    .maybeSingle()
  if (!test) notFound()

  const [{ data: student }, { data: cls }, { data: questions }, { data: attempts }] = await Promise.all([
    admin.from('profiles').select('full_name, nickname').eq('id', test.student_id).maybeSingle(),
    admin.from('classes').select('title').eq('id', test.class_id).maybeSingle(),
    test.question_ids.length > 0
      ? admin.from('questions').select('id, title, content, answer_key, difficulty, points, question_type, mcq_options').in('id', test.question_ids)
      : Promise.resolve({ data: [] as { id: string; title: string; content: string | null; answer_key: string | null; difficulty: string | null; points: number; question_type: string; mcq_options: string[] | null }[] }),
    admin.from('practice_attempts').select('question_id, self_grade, canvas_data, mcq_selected_index, created_at')
      .eq('test_id', testId).eq('student_id', test.student_id).order('created_at', { ascending: false }),
  ])

  const questionById = new Map((questions ?? []).map(q => [q.id, q]))
  // Most recent attempt per question (a student could theoretically retry a review step).
  const attemptByQuestion = new Map<string, { self_grade: string | null; canvas_data: string | null; mcq_selected_index: number | null }>()
  for (const a of attempts ?? []) {
    if (!attemptByQuestion.has(a.question_id)) attemptByQuestion.set(a.question_id, a)
  }

  const displayName = student?.nickname || student?.full_name || 'Unknown student'
  const orderedQuestions = (test.question_ids as string[]).map(id => questionById.get(id)).filter((q): q is NonNullable<typeof q> => !!q)

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href="/teacher/practice-tests" className="text-purple-600 text-sm hover:underline block">← All self-study activity</Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs uppercase tracking-widest text-purple-500 font-semibold">Self-Study Test</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{displayName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{test.title} · {cls?.title} · {orderedQuestions.length} questions{test.duration_minutes ? ` · ${test.duration_minutes} min timed` : ''}</p>
        <p className="text-xs text-gray-400 mt-1">{new Date(test.created_at).toLocaleString()}</p>
      </div>

      {orderedQuestions.map((q, i) => {
        const attempt = attemptByQuestion.get(q.id)
        const gradeBadge = attempt?.self_grade ? GRADE_BADGE[attempt.self_grade] : null
        return (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="font-semibold text-gray-800">Q{i + 1}. {q.title}</p>
              {gradeBadge ? (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${gradeBadge.cls}`}>{gradeBadge.label}</span>
              ) : attempt ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700 flex-shrink-0">Awaiting self-grade</span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-400 flex-shrink-0">Not reached</span>
              )}
            </div>
            {q.content && <QuestionContent text={q.content} className="text-sm text-gray-600 mb-3" />}

            {q.question_type === 'mcq' ? (
              <div className="space-y-1.5">
                {((q.mcq_options ?? []) as string[]).map((opt, oi) => {
                  const wasSelected = attempt?.mcq_selected_index === oi
                  return (
                    <div key={oi} className={`text-sm px-3 py-1.5 rounded-lg border ${wasSelected ? 'border-purple-300 bg-purple-50 font-medium' : 'border-gray-100 text-gray-500'}`}>
                      {opt}{wasSelected ? '  ← student picked this' : ''}
                    </div>
                  )
                })}
              </div>
            ) : (
              <>
                {attempt?.canvas_data ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={attempt.canvas_data} alt="Student's work" className="w-full rounded-xl border border-gray-200 mb-3" />
                ) : (
                  <p className="text-xs text-gray-400 mb-3 italic">No work captured for this question.</p>
                )}
                {q.answer_key && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1.5">Answer Key</p>
                    <AnswerKeyText text={q.answer_key} className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed" />
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
