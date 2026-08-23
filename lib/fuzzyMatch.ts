// Lightweight typo-tolerant search — no search library dependency, matches
// this repo's convention of using plain built-ins over new packages for
// small UI needs. Two checks, either is enough for a match:
// 1) plain case-insensitive substring (fast path for partial typing)
// 2) word-level edit distance — each word in the query is within a small
//    Levenshtein distance of some word in the target, catching misspellings
//    like "stoicheometry" matching "Stoichiometry"

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[] = Array(n + 1).fill(0).map((_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = tmp
    }
  }
  return dp[n]
}

// Whether `word` fuzzy-appears inside `target` — compares against a sliding
// window close to word's length, not the whole target string, so a typo in
// a short word (e.g. "thremo") still matches inside a much longer word
// ("thermodynamics") instead of being swamped by the length difference.
function fuzzyContains(word: string, target: string, maxDist: number): boolean {
  if (target.includes(word)) return true
  if (target.length <= word.length) return levenshtein(word, target) <= maxDist
  for (let winLen = Math.max(1, word.length - maxDist); winLen <= word.length + maxDist; winLen++) {
    for (let start = 0; start + winLen <= target.length; start++) {
      if (levenshtein(word, target.slice(start, start + winLen)) <= maxDist) return true
    }
  }
  return false
}

export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const t = target.toLowerCase()
  if (t.includes(q)) return true

  const targetWords = t.split(/[^a-z0-9]+/).filter(Boolean)
  const queryWords = q.split(/[^a-z0-9]+/).filter(Boolean)
  if (queryWords.length === 0) return true

  return queryWords.every(qw => {
    const threshold = qw.length <= 4 ? 1 : qw.length <= 8 ? 2 : 3
    return targetWords.some(tw => fuzzyContains(qw, tw, threshold))
  })
}
