// Canonical grade vocabulary used across every screen (teacher submissions,
// live board, student banners, reports). One source of truth so the labels,
// colors, and the set of grades are identical everywhere.
//
// Redesigned to match how real grading vocabulary actually reads (AP exams
// score "full credit / partial credit / no credit" — that's exactly the
// language students and teachers already know) instead of five overlapping,
// emoji-heavy categories. "Partial" and "Needs more work" meant almost the
// same thing, so they're merged into one "Partial Credit". The visual style
// is flat and monochrome-icon (a plain ✓ / ✗, not colored emoji pictures),
// closer to Khan Academy / Google Classroom's clean grading UI than a row of
// mismatched colorful pill buttons.

export type GradeKey = 'correct' | 'partial' | 'incorrect' | 'discussed'
// Older submissions may still carry this retired value — kept only so past
// grades still render correctly. It's not offered as a selectable option.
export type LegacyGradeKey = 'needsmore'

export interface GradeDef {
  value: GradeKey
  label: string   // plain label, no icon — used on grading buttons
  icon: string    // small monochrome glyph — used in compact badges/lists
  solid: string   // active/selected segmented-button fill
  badge: string   // small pill style used in lists/reports
}

export const GRADE_LIST: GradeDef[] = [
  { value: 'correct',   label: 'Correct',       icon: '✓', solid: 'bg-green-600 text-white',  badge: 'bg-green-100 text-green-700' },
  { value: 'partial',   label: 'Partial Credit', icon: '½', solid: 'bg-amber-500 text-white',  badge: 'bg-amber-100 text-amber-700' },
  { value: 'incorrect', label: 'Incorrect',      icon: '✗', solid: 'bg-red-600 text-white',    badge: 'bg-red-100 text-red-700' },
  { value: 'discussed', label: 'Discussed',      icon: '💬', solid: 'bg-blue-600 text-white',   badge: 'bg-blue-100 text-blue-700' },
]

// Includes the retired 'needsmore' value so historical badges (old grades
// given before this redesign) still render with sensible text instead of
// breaking or showing raw the DB value.
export const GRADE_MAP: Record<string, GradeDef> = {
  ...Object.fromEntries(GRADE_LIST.map(g => [g.value, g])),
  needsmore: { value: 'partial' as GradeKey, label: 'Partial Credit', icon: '½', solid: 'bg-amber-500 text-white', badge: 'bg-amber-100 text-amber-700' },
}
