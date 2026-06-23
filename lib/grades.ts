// Canonical grade vocabulary used across every screen (teacher submissions,
// live board, student banners, reports). One source of truth so the labels,
// colors, and the set of grades are identical everywhere — instead of each
// screen redefining its own slightly-different version.

export type GradeKey = 'correct' | 'partial' | 'discussed' | 'incorrect' | 'needsmore'

export interface GradeDef {
  value: GradeKey
  label: string   // full button label with icon
  short: string   // plain word
  icon: string
  solid: string   // solid/active button style
  badge: string   // small pill style
}

export const GRADE_LIST: GradeDef[] = [
  { value: 'correct',   label: '✓ Correct',    short: 'Correct',    icon: '✅', solid: 'bg-green-600 text-white',  badge: 'bg-green-100 text-green-700' },
  { value: 'partial',   label: '~ Partial',     short: 'Partial',    icon: '🟡', solid: 'bg-amber-500 text-white',  badge: 'bg-amber-100 text-amber-700' },
  { value: 'discussed', label: '💬 Discussed',  short: 'Discussed',  icon: '💬', solid: 'bg-blue-600 text-white',   badge: 'bg-blue-100 text-blue-700' },
  { value: 'incorrect', label: '✗ Wrong',       short: 'Wrong',      icon: '❌', solid: 'bg-red-600 text-white',    badge: 'bg-red-100 text-red-700' },
  { value: 'needsmore', label: '🔄 Needs more', short: 'Needs more', icon: '🔄', solid: 'bg-purple-600 text-white', badge: 'bg-purple-100 text-purple-700' },
]

export const GRADE_MAP: Record<string, GradeDef> = Object.fromEntries(GRADE_LIST.map(g => [g.value, g]))
