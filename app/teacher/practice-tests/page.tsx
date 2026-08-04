import { createAdminClient } from '@/lib/supabase/server'
import RefreshLayout from '@/components/RefreshLayout'
import PracticeTestListRow from '@/components/practice/PracticeTestListRow'

export default async function PracticeTestsPage() {
  const admin = await createAdminClient()

  const { data: tests } = await admin
    .from('practice_tests')
    .select('id, title, student_id, class_id, question_ids, duration_minutes, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const studentIds = [...new Set((tests ?? []).map(t => t.student_id))]
  const classIds = [...new Set((tests ?? []).map(t => t.class_id))]
  const [{ data: students }, { data: classes }] = await Promise.all([
    studentIds.length > 0 ? admin.from('profiles').select('id, full_name, nickname').in('id', studentIds) : Promise.resolve({ data: [] as { id: string; full_name: string; nickname: string | null }[] }),
    classIds.length > 0 ? admin.from('classes').select('id, title').in('id', classIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])
  const studentById = new Map((students ?? []).map(s => [s.id, s]))
  const classById = new Map((classes ?? []).map(c => [c.id, c]))

  // Score per test — same weighting as the student's own Recent Tests list
  // (correct = full points, incorrect/ungraded = 0), so the teacher sees the
  // same number the student sees.
  const testIds = (tests ?? []).map(t => t.id)
  const allQuestionIds = [...new Set((tests ?? []).flatMap(t => t.question_ids as string[]))]
  const [{ data: attempts }, { data: questionPoints }] = await Promise.all([
    testIds.length > 0
      ? admin.from('practice_attempts').select('test_id, question_id, self_grade').in('test_id', testIds)
      : Promise.resolve({ data: [] as { test_id: string; question_id: string; self_grade: string | null }[] }),
    allQuestionIds.length > 0
      ? admin.from('questions').select('id, points').in('id', allQuestionIds)
      : Promise.resolve({ data: [] as { id: string; points: number }[] }),
  ])
  const pointsByQuestion = new Map((questionPoints ?? []).map(q => [q.id, q.points]))
  const scoreByTest = new Map<string, { earned: number; total: number; graded: number; totalQuestions: number }>()
  for (const t of tests ?? []) {
    const graded = new Set<string>()
    let earned = 0, total = 0
    for (const qid of t.question_ids as string[]) total += pointsByQuestion.get(qid) ?? 1
    for (const a of attempts ?? []) {
      if (a.test_id !== t.id || a.self_grade === null || graded.has(a.question_id)) continue
      graded.add(a.question_id)
      earned += a.self_grade === 'correct' ? (pointsByQuestion.get(a.question_id) ?? 1) : 0
    }
    scoreByTest.set(t.id, { earned, total, graded: graded.size, totalQuestions: (t.question_ids as string[]).length })
  }

  // Visiting this page is what clears the unread badge in the nav.
  await admin.from('practice_test_notifications').update({ read: true }).eq('read', false)

  return (
    <div className="max-w-3xl mx-auto">
      <RefreshLayout />
      <h1 className="text-2xl font-bold text-purple-900 mb-1">Self Study Activity</h1>
      <p className="text-sm text-gray-500 mb-6">Practice tests students have built and completed on their own — questions, their answers, and self-grades.</p>

      {!tests?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">No self-study tests yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tests.map(t => {
            const student = studentById.get(t.student_id)
            const cls = classById.get(t.class_id)
            const score = scoreByTest.get(t.id)
            const completed = !!score && score.graded >= score.totalQuestions
            const pct = score && score.total > 0 ? Math.round((score.earned / score.total) * 100) : null
            const scoreColor = pct === null ? '' : pct >= 80 ? 'text-green-700 bg-green-50' : pct >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-600 bg-red-50'
            return (
              <PracticeTestListRow
                key={t.id}
                testId={t.id}
                studentDisplayName={student?.nickname || student?.full_name || 'Unknown student'}
                title={t.title}
                classTitle={cls?.title ?? ''}
                completed={completed}
                pct={pct}
                scoreColor={scoreColor}
                earned={score?.earned ?? 0}
                total={score?.total ?? 0}
                gradedCount={score?.graded ?? 0}
                totalQuestions={score?.totalQuestions ?? 0}
                questionCount={t.question_ids.length}
                durationMinutes={t.duration_minutes}
                createdAt={t.created_at}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
