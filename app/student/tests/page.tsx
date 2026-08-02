import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StartTestButton from '@/components/diagnostic/StartTestButton'
import CompletedTestCard from '@/components/diagnostic/CompletedTestCard'

// Cross-class view of every published Test — the per-class page
// (app/student/[classId]/page.tsx) only ever shows one class's tests at a
// time, so a student enrolled in multiple classes had no single place to
// see everything pending or already taken.
export default async function StudentTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const studentId = user.id

  const admin = await createAdminClient()

  const { data: enrollments } = await admin.from('class_enrollments').select('class_id').eq('student_id', studentId)
  const classIds = [...new Set((enrollments ?? []).map(e => e.class_id))]

  const { data: classes } = classIds.length > 0
    ? await admin.from('classes').select('id, title').in('id', classIds)
    : { data: [] as { id: string; title: string }[] }
  const classTitleById = new Map((classes ?? []).map(c => [c.id, c.title]))

  const { data: tests } = classIds.length > 0
    ? await admin.from('diagnostic_tests').select('id, title, description, slug, class_id').in('class_id', classIds).eq('is_active', true)
    : { data: [] as { id: string; title: string; description: string | null; slug: string; class_id: string }[] }

  const completedByTestId = new Map<string, { attemptId: string; scorePct: number; submittedAt: string }>()
  if (tests && tests.length > 0) {
    const { data: myLeads } = await admin
      .from('diagnostic_leads')
      .select('id, diagnostic_test_id')
      .eq('student_id', studentId)
      .in('diagnostic_test_id', tests.map(t => t.id))
    const leadIds = (myLeads ?? []).map(l => l.id)
    const testIdByLead = new Map((myLeads ?? []).map(l => [l.id, l.diagnostic_test_id]))
    const { data: myAttempts } = leadIds.length > 0
      ? await admin
          .from('diagnostic_attempts')
          .select('id, lead_id, status, score_pct, submitted_at')
          .in('lead_id', leadIds)
          .eq('status', 'completed')
          .order('submitted_at', { ascending: false })
      : { data: [] as { id: string; lead_id: string; status: string; score_pct: number; submitted_at: string }[] }
    // Most recent completed attempt per test (retakes allowed).
    for (const a of myAttempts ?? []) {
      const testId = testIdByLead.get(a.lead_id)
      if (testId && !completedByTestId.has(testId)) {
        completedByTestId.set(testId, { attemptId: a.id, scorePct: a.score_pct, submittedAt: a.submitted_at })
      }
    }
  }

  const pending = (tests ?? []).filter(t => !completedByTestId.has(t.id))
  const completed = (tests ?? [])
    .filter(t => completedByTestId.has(t.id))
    .sort((a, b) => (completedByTestId.get(b.id)!.submittedAt).localeCompare(completedByTestId.get(a.id)!.submittedAt))

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-900 mb-1">🧪 Tests</h1>
      <p className="text-sm text-gray-500 mb-6">Every test published to your classes — pending ones to take, and your results on the ones you&rsquo;ve finished.</p>

      {!tests?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🧪</div>
          <p className="text-gray-500">No tests published to your classes yet.</p>
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Pending {pending.length > 0 && <span className="text-purple-600">({pending.length})</span>}
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing pending — you&rsquo;re all caught up!</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                {pending.map(t => (
                  <StartTestButton
                    key={t.id}
                    slug={t.slug}
                    title={t.title}
                    description={t.description}
                    classTitle={classTitleById.get(t.class_id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Completed {completed.length > 0 && <span className="text-gray-400">({completed.length})</span>}
            </h2>
            {completed.length === 0 ? (
              <p className="text-sm text-gray-400">No completed tests yet.</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                {completed.map(t => {
                  const c = completedByTestId.get(t.id)!
                  return (
                    <CompletedTestCard
                      key={t.id}
                      slug={t.slug}
                      title={t.title}
                      description={t.description}
                      attemptId={c.attemptId}
                      scorePct={c.scorePct}
                      classTitle={classTitleById.get(t.class_id)}
                    />
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
