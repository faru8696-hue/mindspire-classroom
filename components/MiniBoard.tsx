'use client'

import { useEffect, useRef } from 'react'

// Read-only renderer for a saved whiteboard snapshot (the JSON array of
// strokes/shapes InfiniteWhiteboard produces) — draws it fit-to-frame onto a
// plain canvas. Used anywhere we show a student's board as a thumbnail
// (previously these places tried to use canvas_data directly as an <img src>,
// which silently fails since it's JSON, not an image URL — thumbnails looked
// blank even when the student had real work saved).

interface DrawObj {
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

function parseObjs(json: string | null): DrawObj[] {
  if (!json) return []
  try { return JSON.parse(json) as DrawObj[] } catch { return [] }
}

function contentBounds(objs: DrawObj[]) {
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

const imageCache = new Map<string, HTMLImageElement>()

export default function MiniBoard({
  canvasData, teacherCanvasData, emptyLabel = 'No work yet',
}: { canvasData: string | null; teacherCanvasData?: string | null; emptyLabel?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const draw = () => {
      const rect = container.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)

      // Merge the student's strokes with the teacher's annotation layer
      // (feedback.canvas_data) — previously the tile only ever drew the
      // student's own canvas_data, so anything the teacher had already
      // written on a student's board (from the popup or the full page)
      // was invisible until you opened that student's board again.
      const objs = [...parseObjs(canvasData), ...parseObjs(teacherCanvasData ?? null)]
      const bounds = contentBounds(objs)
      if (!objs.length || !bounds) {
        ctx.fillStyle = '#9ca3af'
        ctx.font = '13px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(emptyLabel, w / 2, h / 2)
        return
      }

      const pad = 16
      const bw = Math.max(1, bounds.maxX - bounds.minX)
      const bh = Math.max(1, bounds.maxY - bounds.minY)
      const zoom = Math.min(4, Math.min((w - pad * 2) / bw, (h - pad * 2) / bh))
      const panX = w / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom
      const panY = h / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom

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
          const src = o.data || ''
          let img = imageCache.get(src)
          if (!img && src) {
            img = new Image()
            img.onload = draw // redraw once the image is actually available
            img.src = src
            imageCache.set(src, img)
          }
          if (img?.complete && img.naturalWidth > 0) ctx.drawImage(img, 0, 0, o.width ?? 100, o.height ?? 100)
        }
        ctx.restore()
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(container)
    return () => ro.disconnect()
  }, [canvasData, teacherCanvasData, emptyLabel])

  return (
    <div ref={containerRef} className="w-full h-full bg-white">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
