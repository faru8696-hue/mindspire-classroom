import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function PracticeHomePage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cls } = await supabase.from('classes').select('title').eq('id', classId).single()

  const [{ data: recentTests }, { count: flagCount }] = await Promise.all([
    supabase.from('practice_tests')
      .select('id, title, question_ids, created_at')
      .eq('student_id', user.id)
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('review_flags').select('id', { count: 'exact', head: true }).eq('student_id', user.id),
  ])

  // Score per test — most recent self-grade/MCQ result per question, scored
  // against that question's point value, same weighting as the in-session
  // summary screen (correct = full points, partial = half, incorrect = 0).
  const testIds = (recentTests ?? []).map(t => t.id)
  const allQuestionIds = [...new Set((recentTests ?? []).flatMap(t => t.question_ids as string[]))]
  const [{ data: attempts }, { data: questionPoints }] = await Promise.all([
    testIds.length > 0
      ? supabase.from('practice_attempts').select('test_id, question_id, self_grade, created_at').in('test_id', testIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as { test_id: string; question_id: string; self_grade: string; created_at: string }[] }),
    allQuestionIds.length > 0
      ? supabase.from('questions').select('id, points').in('id', allQuestionIds)
      : Promise.resolve({ data: [] as { id: string; points: number }[] }),
  ])
  const pointsByQuestion = new Map((questionPoints ?? []).map(q => [q.id, q.points]))
  const scoreByTest = new Map<string, { earned: number; total: number; answered: number; totalQuestions: number }>()
  for (const t of recentTests ?? []) {
    const seen = new Set<string>()
    let earned = 0, total = 0
    for (const qid of t.question_ids as string[]) total += pointsByQuestion.get(qid) ?? 1
    for (const a of attempts ?? []) {
      if (a.test_id !== t.id || seen.has(a.question_id)) continue
      seen.add(a.question_id)
      const pts = pointsByQuestion.get(a.question_id) ?? 1
      earned += a.self_grade === 'correct' ? pts : a.self_grade === 'partial' ? pts * 0.5 : 0
    }
    scoreByTest.set(t.id, { earned, total, answered: seen.size, totalQuestions: (t.question_ids as string[]).length })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/student/${classId}`} className="text-purple-600 text-sm hover:underline mb-4 block">← Back to {cls?.title ?? 'class'}</Link>
      <h1 className="text-2xl font-bold text-purple-900 mb-1">Self Study</h1>
      <p className="text-sm text-gray-500 mb-6">Build your own practice test, or review questions you've flagged — self-checked against the answer key, no teacher grading involved.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          href={`/student/${classId}/practice/build`}
          className="block bg-white rounded-2xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-2">📝</div>
          <h2 className="font-bold text-gray-800">Create a Test</h2>
          <p className="text-sm text-gray-500 mt-1">Pick topics and difficulty, build a custom test, and check your own answers.</p>
        </Link>
        <Link
          href={`/student/${classId}/practice/review`}
          className="block bg-white rounded-2xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-2">🚩</div>
          <h2 className="font-bold text-gray-800">Review Flagged Questions</h2>
          <p className="text-sm text-gray-500 mt-1">
            {flagCount ? `${flagCount} question${flagCount === 1 ? '' : 's'} waiting for review.` : 'Nothing flagged yet — flag any question to save it here.'}
          </p>
        </Link>
      </div>

      {recentTests && recentTests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent tests</h3>
          <div className="space-y-2">
            {recentTests.map(t => {
              const score = scoreByTest.get(t.id)
              const completed = score && score.answered >= score.totalQuestions
              const pct = score && score.total > 0 ? Math.round((score.earned / score.total) * 100) : null
              const scoreColor = pct === null ? '' : pct >= 80 ? 'text-green-700 bg-green-50' : pct >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-600 bg-red-50'
              return (
                <Link
                  key={t.id}
                  href={`/student/${classId}/practice/session/${t.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-purple-300 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700">{t.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {completed && pct !== null ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>{score.earned}/{score.total} pts · {pct}%</span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                        {score && score.answered > 0 ? `In progress (${score.answered}/${score.totalQuestions})` : 'Not started'}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{t.question_ids.length} questions · {new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
