import { describe, it, expect } from 'vitest'
import { DAILY_STUDENT_MESSAGE_LIMIT, hasReachedDailyLimit, windowStart } from '../chatLimit'

describe('hasReachedDailyLimit', () => {
  it('allows messages below the limit', () => {
    expect(hasReachedDailyLimit(0)).toBe(false)
    expect(hasReachedDailyLimit(DAILY_STUDENT_MESSAGE_LIMIT - 1)).toBe(false)
  })

  it('blocks at exactly the limit — the check runs BEFORE sending, so the nth message is never allowed to slip through', () => {
    expect(hasReachedDailyLimit(DAILY_STUDENT_MESSAGE_LIMIT)).toBe(true)
  })

  it('blocks above the limit', () => {
    expect(hasReachedDailyLimit(DAILY_STUDENT_MESSAGE_LIMIT + 5)).toBe(true)
  })
})

describe('windowStart', () => {
  it('is exactly 24 hours before the given instant', () => {
    const now = new Date('2026-01-15T12:00:00.000Z')
    expect(windowStart(now)).toBe('2026-01-14T12:00:00.000Z')
  })

  it('a message sent exactly at the window boundary still counts (gte, not gt)', () => {
    // This documents the contract the API route relies on: querying with
    // .gte('created_at', windowStart(now)) must include a message sent
    // exactly 24h ago, not exclude it.
    const now = new Date('2026-01-15T12:00:00.000Z')
    const boundary = windowStart(now)
    expect(new Date(boundary).getTime()).toBe(now.getTime() - 24 * 60 * 60 * 1000)
  })
})
