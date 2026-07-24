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
