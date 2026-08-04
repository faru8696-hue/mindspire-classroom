import { describe, it, expect } from 'vitest'
import { mcqFirst } from '../sample'

describe('mcqFirst', () => {
  it('moves every mcq before every frq, keeping each group\'s relative order', () => {
    const items = [
      { id: 'f1', question_type: 'frq' },
      { id: 'm1', question_type: 'mcq' },
      { id: 'f2', question_type: 'frq' },
      { id: 'm2', question_type: 'mcq' },
    ]
    expect(mcqFirst(items).map(i => i.id)).toEqual(['m1', 'm2', 'f1', 'f2'])
  })

  it('is a no-op ordering when everything is already mcq or already frq', () => {
    const allMcq = [{ id: 'a', question_type: 'mcq' }, { id: 'b', question_type: 'mcq' }]
    expect(mcqFirst(allMcq).map(i => i.id)).toEqual(['a', 'b'])
    const allFrq = [{ id: 'a', question_type: 'frq' }, { id: 'b', question_type: 'frq' }]
    expect(mcqFirst(allFrq).map(i => i.id)).toEqual(['a', 'b'])
  })

  it('handles an empty list', () => {
    expect(mcqFirst([])).toEqual([])
  })
})
