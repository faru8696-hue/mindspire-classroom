import { describe, it, expect } from 'vitest'
import { parseObjs, contentBounds, DrawObj } from '../boardObjects'

describe('parseObjs', () => {
  it('returns an empty array for null (a board with no saved work yet)', () => {
    expect(parseObjs(null)).toEqual([])
  })

  it('returns an empty array for malformed JSON instead of throwing', () => {
    // A corrupted canvas_data row must never crash a grid render or an
    // AI-check snapshot — this is the actual failure mode it guards against.
    expect(parseObjs('{not valid json')).toEqual([])
  })

  it('parses a valid saved board', () => {
    const json = JSON.stringify([{ id: '1', type: 'text', x: 0, y: 0, rotation: 0, data: 'hi', zIndex: 0 }])
    expect(parseObjs(json)).toHaveLength(1)
  })
})

describe('contentBounds', () => {
  it('returns null for an empty board (nothing to render/check)', () => {
    expect(contentBounds([])).toBeNull()
  })

  it('computes bounds for a pen stroke from its point offsets, not just its origin', () => {
    const stroke: DrawObj = {
      id: '1', type: 'pen', x: 10, y: 10, rotation: 0, zIndex: 0,
      data: JSON.stringify([{ x: 0, y: 0 }, { x: 50, y: 30 }]),
    }
    const bounds = contentBounds([stroke])
    expect(bounds).toEqual({ minX: 10, minY: 10, maxX: 60, maxY: 40 })
  })

  it('computes bounds for a text object using its box, not a stroke path', () => {
    const text: DrawObj = { id: '1', type: 'text', x: 5, y: 5, rotation: 0, zIndex: 0, data: 'answer' }
    const bounds = contentBounds([text])
    // Falls back to the default text box size (160x28) used when width/height aren't set
    expect(bounds).toEqual({ minX: 5, minY: 5, maxX: 165, maxY: 33 })
  })

  it('merges bounds across multiple objects (student strokes + teacher annotation layer)', () => {
    const objs: DrawObj[] = [
      { id: '1', type: 'shape', x: 0, y: 0, width: 20, height: 20, rotation: 0, zIndex: 0 },
      { id: '2', type: 'shape', x: 100, y: 100, width: 20, height: 20, rotation: 0, zIndex: 1 },
    ]
    expect(contentBounds(objs)).toEqual({ minX: 0, minY: 0, maxX: 120, maxY: 120 })
  })
})
