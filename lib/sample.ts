// Fisher-Yates shuffle-and-slice, extracted from
// app/api/practice/create-test/route.ts now that a second caller
// (app/api/diagnostic/start-attempt/route.ts) needs the same logic.
export function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

// Reorders an already-drawn/shuffled set of diagnostic questions so every
// MCQ comes before every FRQ — matching how a real exam is laid out
// (multiple choice section, then free response section) — while keeping
// each group's existing shuffled relative order (so the per-student
// randomization within MCQs, and within FRQs, is untouched).
export function mcqFirst<T extends { question_type: string }>(items: T[]): T[] {
  const mcq = items.filter(q => q.question_type === 'mcq')
  const frq = items.filter(q => q.question_type !== 'mcq')
  return [...mcq, ...frq]
}
