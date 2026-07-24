// Pure grading + advice logic for the diagnostic-test system. No Supabase
// I/O here — everything takes/returns plain data so it's independently
// testable (see lib/__tests__/diagnosticGrading.test.ts) and so the same
// aggregation function can be reused for both a single attempt's breakdown
// and the teacher dashboard's cross-attempt "Class Struggles" panel.

export type MasteryTier = 'mastered' | 'developing' | 'needs-work'

// Matches the 80/50 split already used for score coloring in
// app/teacher/practice-tests/page.tsx (pct >= 80 green / >= 50 amber / else
// red) — not an arbitrary new choice.
export const MASTERY_THRESHOLDS = { mastered: 80, developing: 50 } as const

export function tierFor(pct: number): MasteryTier {
  if (pct >= MASTERY_THRESHOLDS.mastered) return 'mastered'
  if (pct >= MASTERY_THRESHOLDS.developing) return 'developing'
  return 'needs-work'
}

export interface TopicScore {
  topicId: string
  topicTitle: string
  correct: number
  total: number
  pct: number
  tier: MasteryTier
}

// Rolls a flat list of per-question results up into per-topic scores,
// sorted worst-first (lowest pct first).
export function aggregateTopicScores(
  rows: { topicId: string; topicTitle: string; isCorrect: boolean }[]
): TopicScore[] {
  const byTopic = new Map<string, { topicTitle: string; correct: number; total: number }>()
  for (const row of rows) {
    const existing = byTopic.get(row.topicId) ?? { topicTitle: row.topicTitle, correct: 0, total: 0 }
    existing.total += 1
    if (row.isCorrect) existing.correct += 1
    byTopic.set(row.topicId, existing)
  }
  const scores: TopicScore[] = [...byTopic.entries()].map(([topicId, v]) => {
    const pct = v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0
    return { topicId, topicTitle: v.topicTitle, correct: v.correct, total: v.total, pct, tier: tierFor(pct) }
  })
  return scores.sort((a, b) => a.pct - b.pct)
}

export interface DiagnosticQuestionForGrading {
  id: string
  topicId: string
  topicTitle: string
  mcqCorrectIndex: number
  prepAdvice: string | null
}

export interface GradedAttempt {
  correctCount: number
  totalCount: number
  scorePct: number
  topicScores: TopicScore[]
  perQuestion: { questionId: string; isCorrect: boolean }[]
  // Non-mastered topics that have authored prep_advice, worst-first —
  // exactly what both the results page and the PDF render. Deterministic,
  // no AI: this is just a filter + sort over already-authored text.
  advice: { topicTitle: string; prepAdvice: string }[]
}

export function gradeDiagnosticAttempt(
  answers: { questionId: string; selectedIndex: number }[],
  questions: DiagnosticQuestionForGrading[]
): GradedAttempt {
  const answerByQuestion = new Map(answers.map(a => [a.questionId, a.selectedIndex]))

  const perQuestion: { questionId: string; isCorrect: boolean }[] = []
  const topicRows: { topicId: string; topicTitle: string; isCorrect: boolean }[] = []
  let correctCount = 0

  for (const q of questions) {
    const selectedIndex = answerByQuestion.get(q.id)
    const isCorrect = selectedIndex !== undefined && selectedIndex === q.mcqCorrectIndex
    if (isCorrect) correctCount += 1
    perQuestion.push({ questionId: q.id, isCorrect })
    topicRows.push({ topicId: q.topicId, topicTitle: q.topicTitle, isCorrect })
  }

  const totalCount = questions.length
  const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const topicScores = aggregateTopicScores(topicRows)

  const advice = topicScores
    .filter(t => t.tier !== 'mastered')
    .map(t => {
      const topic = questions.find(q => q.topicId === t.topicId)
      return topic?.prepAdvice ? { topicTitle: t.topicTitle, prepAdvice: topic.prepAdvice } : null
    })
    .filter((a): a is { topicTitle: string; prepAdvice: string } => a !== null)

  return { correctCount, totalCount, scorePct, topicScores, perQuestion, advice }
}
