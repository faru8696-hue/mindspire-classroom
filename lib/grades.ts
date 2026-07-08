// Canonical grade vocabulary used across every screen (teacher submissions,
// live board, student banners, reports). One source of truth so the labels,
// colors, and the set of grades are identical everywhere.
//
// Kept intentionally minimal: just Correct / Wrong. Older submissions may
// still carry 'partial', 'discussed', or 'needsmore' from before — those are
// display-only fallbacks (GRADE_MAP) so historical grades still render with
// sensible text/color, but they're no longer offered as selectable options.

export type GradeKey = 'correct' | 'incorrect'
export type LegacyGradeKey = 'partial' | 'discussed' | 'needsmore'

export interface GradeDef {
  value: GradeKey
  label: string   // plain label, no icon — used on grading buttons
  icon: string    // small monochrome glyph — used in compact badges/lists
  solid: string   // active/selected segmented-button fill
  badge: string   // small pill style used in lists/reports
}

export const GRADE_LIST: GradeDef[] = [
  { value: 'correct',   label: 'Correct', icon: '✓', solid: 'bg-green-600 text-white', badge: 'bg-green-100 text-green-700' },
  { value: 'incorrect', label: 'Wrong',   icon: '✗', solid: 'bg-red-600 text-white',   badge: 'bg-red-100 text-red-700' },
]

// Legacy values from before this simplification — display-only, not
// selectable, so old graded work still shows something sensible.
export const GRADE_MAP: Record<string, GradeDef> = {
  ...Object.fromEntries(GRADE_LIST.map(g => [g.value, g])),
  partial:   { value: 'incorrect' as GradeKey, label: 'Partial Credit', icon: '½', solid: 'bg-amber-500 text-white', badge: 'bg-amber-100 text-amber-700' },
  discussed: { value: 'incorrect' as GradeKey, label: 'Discussed',      icon: '💬', solid: 'bg-blue-600 text-white',  badge: 'bg-blue-100 text-blue-700' },
  needsmore: { value: 'incorrect' as GradeKey, label: 'Partial Credit', icon: '½', solid: 'bg-amber-500 text-white', badge: 'bg-amber-100 text-amber-700' },
}
