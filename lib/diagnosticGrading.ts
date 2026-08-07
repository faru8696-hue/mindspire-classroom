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
// sorted worst-first (lowest pct first). Points-based (not a pass/fail
// count) so MCQ (earned 1|0 of 1 possible) and graded FRQ (earned/possible
// points) can land in the same topic bucket — a topic with both question
// types shows one combined mastery bar instead of the FRQ portion being
// silently dropped. Rows with possible <= 0 (an ungraded FRQ) are skipped
// entirely rather than counted as 0, matching computeTotalScore's rule that
// ungraded work shouldn't drag a topic's score down before it's reviewed.
export function aggregateTopicScores(
  rows: { topicId: string; topicTitle: string; earned: number; possible: number }[]
): TopicScore[] {
  const byTopic = new Map<string, { topicTitle: string; correct: number; total: number }>()
  for (const row of rows) {
    if (row.possible <= 0) continue
    const existing = byTopic.get(row.topicId) ?? { topicTitle: row.topicTitle, correct: 0, total: 0 }
    existing.total += row.possible
    existing.correct += row.earned
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
  questionType: 'mcq' | 'frq'
  mcqCorrectIndex: number | null
  prepAdvice: string | null
}

export interface GradedAttempt {
  correctCount: number
  totalCount: number
  scorePct: number
  topicScores: TopicScore[]
  // FRQ questions carry isCorrect: null — they're not auto-graded, just
  // reviewed afterward, so they're excluded from correctCount/totalCount/
  // topicScores/scorePct entirely (an FRQ-heavy test shouldn't drag down
  // or inflate a score that's supposed to reflect objective correctness).
  perQuestion: { questionId: string; questionType: 'mcq' | 'frq'; isCorrect: boolean | null }[]
  // Non-mastered topics that have authored prep_advice, worst-first —
  // exactly what both the results page and the PDF render. Deterministic,
  // no AI: this is just a filter + sort over already-authored text.
  advice: { topicTitle: string; prepAdvice: string }[]
}

export function gradeDiagnosticAttempt(
  answers: { questionId: string; selectedIndex?: number }[],
  questions: DiagnosticQuestionForGrading[]
): GradedAttempt {
  const answerByQuestion = new Map(answers.map(a => [a.questionId, a.selectedIndex]))

  const perQuestion: { questionId: string; questionType: 'mcq' | 'frq'; isCorrect: boolean | null }[] = []
  const topicRows: { topicId: string; topicTitle: string; earned: number; possible: number }[] = []
  let correctCount = 0
  let totalCount = 0

  for (const q of questions) {
    if (q.questionType === 'frq') {
      perQuestion.push({ questionId: q.id, questionType: 'frq', isCorrect: null })
      continue
    }
    const selectedIndex = answerByQuestion.get(q.id)
    const isCorrect = selectedIndex !== undefined && selectedIndex === q.mcqCorrectIndex
    if (isCorrect) correctCount += 1
    totalCount += 1
    perQuestion.push({ questionId: q.id, questionType: 'mcq', isCorrect })
    topicRows.push({ topicId: q.topicId, topicTitle: q.topicTitle, earned: isCorrect ? 1 : 0, possible: 1 })
  }

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

// Combines the MCQ score (1 point per question, always fully graded) with
// whatever FRQ points have been graded so far into a single overall score.
// `possible` only counts FRQ points from graded questions (frq.gradedPoints,
// not frq.totalPoints) — ungraded FRQ shouldn't drag the total down before a
// teacher has actually reviewed them. `fullyGraded` tells the caller whether
// this is a final number or still provisional.
export function computeTotalScore(
  correctCount: number,
  totalCount: number,
  frq: { totalCount: number; gradedCount: number; totalPoints: number; gradedPoints: number; earnedPoints: number } | null
): { earned: number; possible: number; pct: number; fullyGraded: boolean } {
  const earned = correctCount + (frq?.earnedPoints ?? 0)
  const possible = totalCount + (frq?.gradedPoints ?? 0)
  const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0
  const fullyGraded = !frq || frq.gradedCount === frq.totalCount
  return { earned, possible, pct, fullyGraded }
}

export type IntegrityTier = 'none' | 'mild' | 'moderate' | 'severe'

export interface IntegrityAssessment {
  awaySeconds: number
  awayCount: number
  // awaySeconds as a fraction of the test's total duration, clamped to
  // [0, 1] — the primary signal, since "90 seconds away" means something
  // very different on a 10-minute quiz vs. a 2-hour exam.
  awayFraction: number
  deductionPct: number
  tier: IntegrityTier
  // Only true for 'severe' — a pattern hard to explain as innocent
  // (a large share of the test spent away, or a high number of trips).
  // Surfaced as a flag for teacher review, not an automatic zero.
  likelyCheating: boolean
}

// Tuning constants for the deduction curve below. Individual away-events
// under 5s are already filtered out entirely at the source (see
// DiagnosticTestSession's AWAY_GRACE_SECONDS) — these thresholds are about
// the AGGREGATE pattern across the whole attempt.
const GRACE_SECONDS = 20     // total away-time at/under this, with few trips: no deduction
const GRACE_COUNT = 2        // trip count at/under this, with little time: no deduction
const SEVERE_FRACTION = 0.25 // away for more than a quarter of the test: severe
const SEVERE_COUNT = 10      // more than this many trips away: severe, regardless of duration
const MIN_DEDUCTION_PCT = 5  // deduction just above the grace zone
const SEVERE_DEDUCTION_PCT = 50 // deduction ceiling for the severe tier

// Deducts points from a test score based on how much of the test was spent
// away from the tab. This is a judgment call, not a certainty — a couple of
// short, spaced-out trips barely register, while spending a large share of
// the test away, or leaving very frequently, is flagged as likely cheating
// (a pattern that's hard to explain as innocent) rather than just quietly
// docking a few points. Not auto-zeroed even then — a teacher reviews it.
export function assessTestIntegrity(awaySeconds: number, awayCount: number, durationMinutes: number): IntegrityAssessment {
  const durationSeconds = Math.max(1, durationMinutes * 60)
  const awayFraction = Math.min(1, awaySeconds / durationSeconds)

  if (awaySeconds <= GRACE_SECONDS && awayCount <= GRACE_COUNT) {
    return { awaySeconds, awayCount, awayFraction, deductionPct: 0, tier: 'none', likelyCheating: false }
  }

  if (awayFraction > SEVERE_FRACTION || awayCount > SEVERE_COUNT) {
    return { awaySeconds, awayCount, awayFraction, deductionPct: SEVERE_DEDUCTION_PCT, tier: 'severe', likelyCheating: true }
  }

  // Linear ramp from MIN_DEDUCTION_PCT (just past the grace zone) up to
  // SEVERE_DEDUCTION_PCT (at the severe-fraction boundary).
  const deductionPct = Math.round(
    MIN_DEDUCTION_PCT + (awayFraction / SEVERE_FRACTION) * (SEVERE_DEDUCTION_PCT - MIN_DEDUCTION_PCT)
  )
  const tier: IntegrityTier = deductionPct < 20 ? 'mild' : 'moderate'
  return { awaySeconds, awayCount, awayFraction, deductionPct, tier, likelyCheating: false }
}

// Applies a percentage deduction (from assessTestIntegrity) to an
// already-computed total score. `possible` (the denominator) is left
// untouched — the test wasn't worth fewer points, the student's earned
// score was docked — so "X/Y" displays stay meaningful before and after.
export function applyIntegrityDeduction(
  total: { earned: number; possible: number; pct: number; fullyGraded: boolean },
  deductionPct: number
): { earned: number; possible: number; pct: number; fullyGraded: boolean } {
  if (deductionPct <= 0) return total
  const factor = 1 - deductionPct / 100
  const earned = Math.round(total.earned * factor)
  const pct = total.possible > 0 ? Math.round((earned / total.possible) * 100) : 0
  return { earned, possible: total.possible, pct, fullyGraded: total.fullyGraded }
}
