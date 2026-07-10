// Shared shape/parsing helpers for the saved whiteboard JSON format, used by
// both the live MiniBoard renderer and the offscreen AI-check snapshot
// renderer so the object model only lives in one place.

export interface DrawObj {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  rotation: number
  data?: string
  color?: string
  fillColor?: string
  shapeType?: string
  strokeWidth?: number
  fontSize?: number
  fontFamily?: string
  zIndex: number
}

export function parseObjs(json: string | null): DrawObj[] {
  if (!json) return []
  try { return JSON.parse(json) as DrawObj[] } catch { return [] }
}

export function contentBounds(objs: DrawObj[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const o of objs) {
    if (o.type === 'pen' || o.type === 'highlighter') {
      let pts: { x: number; y: number }[] = []
      try { pts = JSON.parse(o.data || '[]') } catch {}
      for (const p of pts) {
        const px = o.x + p.x, py = o.y + p.y
        if (px < minX) minX = px
        if (py < minY) minY = py
        if (px > maxX) maxX = px
        if (py > maxY) maxY = py
      }
    } else {
      const w = o.width ?? (o.type === 'text' ? 160 : 100)
      const h = o.height ?? (o.type === 'text' ? 28 : 100)
      if (o.x < minX) minX = o.x
      if (o.y < minY) minY = o.y
      if (o.x + w > maxX) maxX = o.x + w
      if (o.y + h > maxY) maxY = o.y + h
    }
  }
  if (!isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}
