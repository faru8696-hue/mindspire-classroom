// Classifies a Gemini API error message so routes can show the right
// user-facing message instead of the raw error. Extracted so this logic
// (previously duplicated inline in ai-chat/ai-check routes) is testable and
// only lives in one place.

export function isQuotaExceeded(message: string): boolean {
  return message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
}

export function isOverloaded(message: string): boolean {
  return message.includes('503') || message.includes('UNAVAILABLE')
}
