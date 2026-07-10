import { describe, it, expect } from 'vitest'
import { isQuotaExceeded, isOverloaded } from '../geminiErrors'

describe('isQuotaExceeded', () => {
  it('detects the real Gemini quota-exceeded error shape', () => {
    const message = `Gemini API error 429: { "error": { "code": 429, "status": "RESOURCE_EXHAUSTED", "message": "You exceeded your current quota" } }`
    expect(isQuotaExceeded(message)).toBe(true)
  })

  it('does not misclassify an unrelated error as quota exceeded', () => {
    expect(isQuotaExceeded('GEMINI_API_KEY is not set')).toBe(false)
    expect(isQuotaExceeded('Gemini API error 404: model not found')).toBe(false)
  })
})

describe('isOverloaded', () => {
  it('detects the real Gemini overload error shape', () => {
    const message = `Gemini API error 503: { "error": { "code": 503, "status": "UNAVAILABLE", "message": "high demand" } }`
    expect(isOverloaded(message)).toBe(true)
  })

  it('does not misclassify a quota error as overload (they get different user-facing messages)', () => {
    const quotaMessage = 'Gemini API error 429: RESOURCE_EXHAUSTED'
    expect(isOverloaded(quotaMessage)).toBe(false)
  })
})
