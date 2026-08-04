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
    .select('id, diagnostic_test_id, lead_id, question_ids, status, started_at')
    .eq('id', attemptId)
    .maybeSingle()
  if (!attempt) notFound()

  // Already finished this attempt — send to results instead of re-taking it.
  if (attempt.status === 'completed') redirect(`/diagnostic/${slug}/results/${attemptId}`)

  const [{ data: test }, { data: lead }, { data: draftAnswers }] = await Promise.all([
    admin.from('diagnostic_tests').select('title, duration_minutes').eq('id', attempt.diagnostic_test_id).maybeSingle(),
    admin.from('diagnostic_leads').select('student_name, student_email').eq('id', attempt.lead_id).maybeSingle(),
    // Autosaved progress from an earlier visit (closed tab, browser crash,
    // etc.) — restored so re-opening the attempt resumes where the student
    // left off instead of starting blank. Not present at all until the
    // first autosave fires.
    admin.from('diagnostic_attempt_answers').select('question_id, selected_index, canvas_data').eq('attempt_id', attemptId),
  ])
  if (!test) notFound()

  const questionIds = attempt.question_ids as string[]
  const { data: questions } = await admin
    .from('diagnostic_questions')
    .select('id, content, image_url, mcq_options, question_type, topic_id')
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
      questionType: (q.question_type as 'mcq' | 'frq') ?? 'mcq',
      options: q.mcq_options as string[] | null,
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
      startedAt={attempt.started_at}
      studentName={lead?.student_name ?? ''}
      studentEmail={lead?.student_email ?? ''}
      initialAnswers={(draftAnswers ?? [])
        .filter(a => a.selected_index !== null)
        .map(a => ({ questionId: a.question_id, selectedIndex: a.selected_index as number }))}
      initialCanvasByQuestion={(draftAnswers ?? [])
        .filter(a => a.canvas_data !== null)
        .map(a => ({ questionId: a.question_id, canvasData: a.canvas_data as string }))}
    />
  )
}
