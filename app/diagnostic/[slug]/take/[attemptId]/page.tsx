import { createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import DiagnosticTestSession, { type DiagnosticSessionQuestion } from '@/components/diagnostic/DiagnosticTestSession'

export default async function DiagnosticTakePage({
  params,
}: {
  params: Promise<{ slug: string; attemptId: string }>
}) {
  const { slug, attemptId } = await params
  const admin = await createAdminClient()

  const { data: attempt } = await admin
    .from('diagnostic_attempts')
    .select('id, diagnostic_test_id, question_ids, status')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) notFound()

  // Already finished this attempt — send to results instead of re-taking it.
  if (attempt.status === 'completed') redirect(`/diagnostic/${slug}/results/${attemptId}`)

  const { data: test } = await admin
    .from('diagnostic_tests')
    .select('title, duration_minutes')
    .eq('id', attempt.diagnostic_test_id)
    .maybeSingle()
  if (!test) notFound()

  const questionIds = attempt.question_ids as string[]
  const { data: questions } = await admin
    .from('diagnostic_questions')
    .select('id, content, image_url, mcq_options, topic_id')
    .in('id', questionIds)

  const topicIds = [...new Set((questions ?? []).map(q => q.topic_id))]
  const { data: topics } = topicIds.length > 0
    ? await admin.from('diagnostic_topics').select('id, title').in('id', topicIds)
    : { data: [] as { id: string; title: string }[] }
  const topicTitleById = new Map((topics ?? []).map(t => [t.id, t.title]))
  const questionById = new Map((questions ?? []).map(q => [q.id, q]))

  // Reorder to match the locked, randomized question_ids array, not
  // whatever order Postgres happened to return rows in.
  const sessionQuestions: DiagnosticSessionQuestion[] = questionIds
    .map(id => questionById.get(id))
    .filter((q): q is NonNullable<typeof q> => !!q)
    .map(q => ({
      id: q.id,
      content: q.content,
      imageUrl: q.image_url,
      options: q.mcq_options as string[],
      topicId: q.topic_id,
      topicTitle: topicTitleById.get(q.topic_id) ?? 'General',
    }))

  return (
    <DiagnosticTestSession
      slug={slug}
      attemptId={attemptId}
      testTitle={test.title}
      questions={sessionQuestions}
      durationMinutes={test.duration_minutes}
    />
  )
}
