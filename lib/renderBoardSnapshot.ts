import { DrawObj, parseObjs, contentBounds } from './boardObjects'

// Renders a saved whiteboard's JSON (student strokes + optional teacher
// annotation layer) onto an offscreen canvas and returns a PNG data URL —
// this is what lets the teacher-grid AI checker "see" a student's board
// without that student's InfiniteWhiteboard component being mounted (the
// grid only ever renders MiniBoard, a separate lightweight canvas renderer).
// Returns null if there's nothing to draw.
export async function renderBoardSnapshot(
  canvasData: string | null,
  teacherCanvasData: string | null,
  width = 640,
  height = 500,
): Promise<string | null> {
  const objs = [...parseObjs(canvasData), ...parseObjs(teacherCanvasData)]
  const bounds = contentBounds(objs)
  if (!objs.length || !bounds) return null

  const imgObjs = objs.filter((o): o is DrawObj & { data: string } => o.type === 'image' && !!o.data)
  const loadedImages = new Map<string, HTMLImageElement>()
  await Promise.all(imgObjs.map(o => new Promise<void>(resolve => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = o.data
    loadedImages.set(o.data, img)
  })))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const pad = 24
  const bw = Math.max(1, bounds.maxX - bounds.minX)
  const bh = Math.max(1, bounds.maxY - bounds.minY)
  const zoom = Math.min(4, Math.min((width - pad * 2) / bw, (height - pad * 2) / bh))
  const panX = width / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom
  const panY = height / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom

  for (const o of [...objs].sort((a, b) => a.zIndex - b.zIndex)) {
    ctx.save()
    ctx.translate(panX + o.x * zoom, panY + o.y * zoom)
    ctx.scale(zoom, zoom)
    ctx.rotate((o.rotation * Math.PI) / 180)

    if (o.type === 'pen' || o.type === 'highlighter') {
      let pts: { x: number; y: number }[] = []
      try { pts = JSON.parse(o.data || '[]') } catch {}
      if (pts.length > 1) {
        if (o.type === 'highlighter') { ctx.globalAlpha = 0.4; ctx.strokeStyle = '#fff200'; ctx.lineWidth = o.strokeWidth || 16; ctx.lineCap = 'butt' }
        else { ctx.strokeStyle = o.color || '#000'; ctx.lineWidth = o.strokeWidth || 2; ctx.lineCap = 'round' }
        ctx.lineJoin = 'round'
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        ctx.stroke(); ctx.globalAlpha = 1
      }
    } else if (o.type === 'shape') {
      const sw = o.width ?? 100, sh = o.height ?? 100
      ctx.strokeStyle = o.color || '#000'; ctx.lineWidth = o.strokeWidth || 2
      if (o.shapeType === 'rectangle') ctx.strokeRect(0, 0, sw, sh)
      else if (o.shapeType === 'circle') { const r = Math.min(sw, sh) / 2; ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.stroke() }
      else if (o.shapeType === 'line' || o.shapeType === 'arrow') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sw, sh); ctx.stroke() }
    } else if (o.type === 'text') {
      const fontSize = o.fontSize ?? 20
      ctx.fillStyle = o.color || '#000'; ctx.font = `${fontSize}px ${o.fontFamily || 'Arial'}`; ctx.textAlign = 'left'
      const lines = (o.data || '').split('\n')
      lines.forEach((line, i) => ctx.fillText(line, 0, fontSize * (i + 1) * 1.2 - fontSize * 0.2))
    } else if (o.type === 'sticky') {
      const sw = o.width ?? 150, sh = o.height ?? 150
      ctx.fillStyle = o.fillColor || '#ffff00'; ctx.fillRect(0, 0, sw, sh)
      ctx.strokeStyle = '#ddd'; ctx.strokeRect(0, 0, sw, sh)
      ctx.fillStyle = o.color || '#000'; ctx.font = '14px Arial'; ctx.textAlign = 'left'
      ctx.fillText(o.data || '', 10, 25)
    } else if (o.type === 'image') {
      const img = loadedImages.get(o.data || '')
      if (img?.naturalWidth) ctx.drawImage(img, 0, 0, o.width ?? 100, o.height ?? 100)
    }
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}
