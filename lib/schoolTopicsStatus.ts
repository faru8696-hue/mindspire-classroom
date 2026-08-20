// Shared by the server-side login gate (app/student/layout.tsx) and the
// client-side checklist (SchoolTopicsChecklist.tsx) so "is this class
// current" can never drift between the two. A test date (or a "hasn't
// started" start date) works like an expiration date: once it's passed, it
// no longer counts as a valid signal, so the class falls back to
// "incomplete" and the student is asked again.

export interface TopicPlanRow {
  classId: string
  testDate: string | null
}

export interface StatusRow {
  notStarted: boolean
  startsOn: string | null
  otherTopics: string | null
}

export function isClassCurrent(
  classId: string,
  plans: TopicPlanRow[],
  status: StatusRow | undefined,
  todayIso: string,
): boolean {
  const hasCurrentTopic = plans.some(p => p.classId === classId && (!p.testDate || p.testDate >= todayIso))
  if (hasCurrentTopic) return true
  if (status?.otherTopics?.trim()) return true
  if (status?.notStarted && (!status.startsOn || status.startsOn >= todayIso)) return true
  return false
}
