import { describe, it, expect } from 'vitest'
import { GRADE_LIST, GRADE_MAP } from '../grades'

describe('grade vocabulary', () => {
  it('every selectable grade also has a GRADE_MAP entry (badges/reports would silently show nothing otherwise)', () => {
    for (const g of GRADE_LIST) {
      expect(GRADE_MAP[g.value]).toBeDefined()
    }
  })

  it('legacy grade values map to a real selectable grade, so old submissions still render sensibly', () => {
    const selectableValues = new Set(GRADE_LIST.map(g => g.value))
    for (const legacyKey of ['partial', 'discussed', 'needsmore']) {
      expect(selectableValues.has(GRADE_MAP[legacyKey].value)).toBe(true)
    }
  })

  it('only correct/incorrect are offered as selectable grades (the intentional simplification)', () => {
    expect(GRADE_LIST.map(g => g.value).sort()).toEqual(['correct', 'incorrect'])
  })
})
