// Cost guardrail for the student AI Faridah chat — caps messages per
// student per rolling 24h, across all questions. Extracted from
// app/api/ai-chat/route.ts so the threshold logic is testable without a
// live Supabase connection.

export const DAILY_STUDENT_MESSAGE_LIMIT = 10

export function hasReachedDailyLimit(messagesSentToday: number): boolean {
  return messagesSentToday >= DAILY_STUDENT_MESSAGE_LIMIT
}

// The rolling-24h window start, as an ISO string for a Supabase `.gte()`
// filter. Takes `now` as a param (rather than calling Date.now() inside)
// so tests can pin the clock.
export function windowStart(now: Date): string {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
}
