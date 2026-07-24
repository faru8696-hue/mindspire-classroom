import { describe, it, expect } from 'vitest'
import { tierFor, aggregateTopicScores, gradeDiagnosticAttempt, MASTERY_THRESHOLDS } from '../diagnosticGrading'

describe('tierFor', () => {
  it('is "mastered" at and above the mastered threshold', () => {
    expect(tierFor(MASTERY_THRESHOLDS.mastered)).toBe('mastered')
    expect(tierFor(100)).toBe('mastered')
  })

  it('is "developing" at and above the developing threshold but below mastered', () => {
    expect(tierFor(MASTERY_THRESHOLDS.developing)).toBe('developing')
    expect(tierFor(MASTERY_THRESHOLDS.mastered - 1)).toBe('developing')
  })

  it('is "needs-work" below the developing threshold', () => {
    expect(tierFor(MASTERY_THRESHOLDS.developing - 1)).toBe('needs-work')
    expect(tierFor(0)).toBe('needs-work')
  })
})

describe('aggregateTopicScores', () => {
  it('groups by topic and sorts worst-first', () => {
    const scores = aggregateTopicScores([
      { topicId: 'a', topicTitle: 'Topic A', isCorrect: true },
      { topicId: 'a', topicTitle: 'Topic A', isCorrect: true },
      { topicId: 'b', topicTitle: 'Topic B', isCorrect: false },
      { topicId: 'b', topicTitle: 'Topic B', isCorrect: true },
    ])
    expect(scores).toHaveLength(2)
    expect(scores[0].topicId).toBe('b') // 50% — worse than a's 100%, so first
    expect(scores[0].pct).toBe(50)
    expect(scores[1].topicId).toBe('a')
    expect(scores[1].pct).toBe(100)
  })
})

describe('gradeDiagnosticAttempt', () => {
  const questions = [
    { id: 'q1', topicId: 't1', topicTitle: 'Stoichiometry', mcqCorrectIndex: 0, prepAdvice: 'Review mole conversions.' },
    { id: 'q2', topicId: 't1', topicTitle: 'Stoichiometry', mcqCorrectIndex: 1, prepAdvice: 'Review mole conversions.' },
    { id: 'q3', topicId: 't2', topicTitle: 'Sig Figs', mcqCorrectIndex: 2, prepAdvice: null },
  ]

  it('computes correct/incorrect per question and an overall score', () => {
    const result = gradeDiagnosticAttempt(
      [{ questionId: 'q1', selectedIndex: 0 }, { questionId: 'q2', selectedIndex: 0 }, { questionId: 'q3', selectedIndex: 2 }],
      questions
    )
    expect(result.correctCount).toBe(2)
    expect(result.totalCount).toBe(3)
    expect(result.scorePct).toBe(67)
    expect(result.perQuestion).toEqual([
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: false },
      { questionId: 'q3', isCorrect: true },
    ])
  })

  it('treats a missing answer as incorrect rather than throwing', () => {
    const result = gradeDiagnosticAttempt([{ questionId: 'q1', selectedIndex: 0 }], questions)
    expect(result.correctCount).toBe(1)
    expect(result.totalCount).toBe(3)
  })

  it('excludes mastered topics and topics with no authored advice, worst-first', () => {
    // q1 wrong, q2 wrong -> Stoichiometry 0%. q3 correct -> Sig Figs 100% (mastered, excluded).
    const result = gradeDiagnosticAttempt(
      [{ questionId: 'q1', selectedIndex: 1 }, { questionId: 'q2', selectedIndex: 0 }, { questionId: 'q3', selectedIndex: 2 }],
      questions
    )
    expect(result.advice).toEqual([{ topicTitle: 'Stoichiometry', prepAdvice: 'Review mole conversions.' }])
  })

  it('produces no advice when every topic is mastered', () => {
    const result = gradeDiagnosticAttempt(
      [{ questionId: 'q1', selectedIndex: 0 }, { questionId: 'q2', selectedIndex: 1 }, { questionId: 'q3', selectedIndex: 2 }],
      questions
    )
    expect(result.advice).toEqual([])
  })
})
