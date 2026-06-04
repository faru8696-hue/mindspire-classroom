'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const imageCache = new Map<string, HTMLImageElement>()

type Tool = 'pointer' | 'pan' | 'pen' | 'highlighter' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'sticky'
type DragMode = 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'rotate'

interface DrawObject {
  id: string
  type: 'pen' | 'highlighter' | 'shape' | 'text' | 'sticky' | 'image'
  x: number
  y: number
  width?: number
  height?: number
  rotation: number
  data?: string
  color?: string
  fillColor?: string
  shapeType?: 'rectangle' | 'circle' | 'line' | 'arrow'
  strokeWidth?: number
  zIndex: number
}

interface ViewState { panX: number; panY: number; zoom: number }

const MIN_ZOOM = 0.1
const MAX_ZOOM = 8
const GRID = 40

interface Props {
  questionId: string
  studentId: string
  role: 'student' | 'teacher'
  initialStudentData?: string | null
  initialTeacherData?: string | null
  onSaveStudent?: (data: string) => Promise<void>
  onSaveTeacher?: (data: string) => Promise<void>
}

function loadSaved(raw: string | null | undefined): DrawObject[] {
  if (!raw) return []
  try { return JSON.parse(raw) as DrawObject[] } catch { return [] }
}

export default function InfiniteWhiteboard({
  questionId, studentId, role,
  initialStudentData, initialTeacherData,
  onSaveStudent, onSaveTeacher,
}: Props) {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── All canvas state lives in refs so render loop always sees latest ──
  // Each user owns their own layer; the other user's layer is read-only
  const ownData = role === 'student' ? initialStudentData : initialTeacherData
  const remoteData = role === 'student' ? initialTeacherData : initialStudentData
  const objsRef = useRef<DrawObject[]>(loadSaved(ownData))
  const remoteObjsRef = useRef<DrawObject[]>(loadSaved(remoteData))
  const viewRef = useRef<ViewState>({ panX: 0, panY: 0, zoom: 1 })
  const toolRef = useRef<Tool>('pen')
  const colorRef = useRef('#000000')
  const selIdRef = useRef<string | null>(null)
  const isDrawingRef = useRef(false)
  const currentPath = useRef<{ x: number; y: number }[]>([])
  const panStart = useRef<{ x: number; y: number } | null>(null)
  const shapeStart = useRef<{ x: number; y: number } | null>(null)
  const shapeEnd = useRef<{ x: number; y: number } | null>(null)
  const dragMode = useRef<DragMode | null>(null)
  const dragObjId = useRef<string | null>(null)
  const dragStartMouse = useRef<{ x: number; y: number } | null>(null)
  const dragStartObj = useRef<{ x: number; y: number; width: number; height: number; rotation: number } | null>(null)
  const history = useRef<DrawObject[][]>([])
  const redoStack = useRef<DrawObject[][]>([])

  // ── React state only for UI controls that need re-render ──
  const [tool, _setTool] = useState<Tool>('pen')
  const [color, _setColor] = useState('#000000')
  const [view, _setView] = useState<ViewState>({ panX: 0, panY: 0, zoom: 1 })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [liveIndicator, setLiveIndicator] = useState(false)
  const [objCount, setObjCount] = useState(objsRef.current.length)
  const [selId, setSelId] = useState<string | null>(null)

  const setTool = (t: Tool) => { toolRef.current = t; _setTool(t) }
  const setColor = (c: string) => { colorRef.current = c; _setColor(c) }
  const setView = (v: ViewState) => { viewRef.current = v; _setView(v) }

  // commitObjects: updates ref (for render) AND state (for save/broadcast)
  const commitObjects = useCallback((updater: (prev: DrawObject[]) => DrawObject[]) => {
    const next = updater(objsRef.current)
    objsRef.current = next
    setObjCount(next.length)
  }, [])

  // ── Undo / redo ───────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    history.current.push([...objsRef.current])
    if (history.current.length > 50) history.current.shift()
    redoStack.current = []
  }, [])

  const doUndo = useCallback(() => {
    if (!history.current.length) return
    redoStack.current.push([...objsRef.current])
    const prev = history.current.pop()!
    objsRef.current = prev
    setObjCount(prev.length)
  }, [])

  const doRedo = useCallback(() => {
    if (!redoStack.current.length) return
    history.current.push([...objsRef.current])
    const next = redoStack.current.pop()!
    objsRef.current = next
    setObjCount(next.length)
  }, [])

  // ── Coordinate helpers ────────────────────────────────────────
  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    const v = viewRef.current
    return { x: (sx - rect.left - v.panX) / v.zoom, y: (sy - rect.top - v.panY) / v.zoom }
  }, [])

  const getScreenMouse = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    return { mx: e.clientX - (rect?.left ?? 0), my: e.clientY - (rect?.top ?? 0) }
  }

  // ── Continuous render loop ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let rafId: number

    const loop = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx || canvas.width === 0 || canvas.height === 0) { rafId = requestAnimationFrame(loop); return }

      const v = viewRef.current
      const objs = objsRef.current
      const selId = selIdRef.current

      // Clear
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid
      ctx.strokeStyle = '#ebebeb'
      ctx.lineWidth = 1
      const gs = GRID * v.zoom
      const ox = ((v.panX % gs) + gs) % gs
      const oy = ((v.panY % gs) + gs) % gs
      for (let x = ox; x < canvas.width; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke() }
      for (let y = oy; y < canvas.height; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke() }

      // Remote (other user's) objects — drawn first, slightly dimmed
      const remoteObjs = remoteObjsRef.current
      const remoteSorted = [...remoteObjs].sort((a, b) => a.zIndex - b.zIndex)
      ctx.save(); ctx.globalAlpha = 0.55
      for (const obj of remoteSorted) {
        ctx.save()
        ctx.translate(v.panX + obj.x * v.zoom, v.panY + obj.y * v.zoom)
        ctx.scale(v.zoom, v.zoom)
        ctx.rotate((obj.rotation * Math.PI) / 180)
        if (obj.type === 'pen' || obj.type === 'highlighter') {
          const pts = JSON.parse(obj.data || '[]') as { x: number; y: number }[]
          if (pts.length > 1) {
            if (obj.type === 'highlighter') ctx.globalAlpha = 0.25
            ctx.strokeStyle = obj.color || '#000'
            ctx.lineWidth = obj.strokeWidth || 2
            ctx.lineCap = 'round'; ctx.lineJoin = 'round'
            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
            ctx.stroke(); ctx.globalAlpha = 1
          }
        } else if (obj.type === 'shape') {
          const w = obj.width ?? 100, h = obj.height ?? 100
          ctx.strokeStyle = obj.color || '#000'; ctx.lineWidth = obj.strokeWidth || 2
          if (obj.shapeType === 'rectangle') { ctx.strokeRect(0, 0, w, h) }
          else if (obj.shapeType === 'circle') { const r = Math.min(w, h) / 2; ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.stroke() }
          else if (obj.shapeType === 'line') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.stroke() }
          else if (obj.shapeType === 'arrow') {
            const hl = 15, ang = Math.atan2(h, w)
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(w - hl * Math.cos(ang - Math.PI / 6), h - hl * Math.sin(ang - Math.PI / 6))
            ctx.lineTo(w, h)
            ctx.lineTo(w - hl * Math.cos(ang + Math.PI / 6), h - hl * Math.sin(ang + Math.PI / 6))
            ctx.stroke()
          }
        } else if (obj.type === 'text') {
          ctx.fillStyle = obj.color || '#000'; ctx.font = '16px Arial'
          ctx.fillText(obj.data || '', 0, 20)
        } else if (obj.type === 'sticky') {
          const w = obj.width ?? 150, h = obj.height ?? 150
          ctx.fillStyle = obj.fillColor || '#ffff00'; ctx.fillRect(0, 0, w, h)
          ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, w, h)
          ctx.fillStyle = obj.color || '#000'; ctx.font = '14px Arial'
          ctx.fillText(obj.data || '', 10, 25)
        } else if (obj.type === 'image') {
          const src = obj.data || ''
          const cached = imageCache.get(src)
          if (cached?.complete && cached.naturalWidth > 0) {
            ctx.drawImage(cached, 0, 0, obj.width ?? 100, obj.height ?? 100)
          } else if (src && !cached) {
            const img = new Image(); img.src = src; imageCache.set(src, img)
          }
        }
        ctx.restore()
      }
      ctx.restore()

      // Own objects
      const sorted = [...objs].sort((a, b) => a.zIndex - b.zIndex)
      for (const obj of sorted) {
        ctx.save()
        ctx.translate(v.panX + obj.x * v.zoom, v.panY + obj.y * v.zoom)
        ctx.scale(v.zoom, v.zoom)
        ctx.rotate((obj.rotation * Math.PI) / 180)

        if (obj.type === 'pen' || obj.type === 'highlighter') {
          const pts = JSON.parse(obj.data || '[]') as { x: number; y: number }[]
          if (pts.length > 1) {
            if (obj.type === 'highlighter') ctx.globalAlpha = 0.4
            ctx.strokeStyle = obj.color || '#000'
            ctx.lineWidth = obj.strokeWidth || 2
            ctx.lineCap = 'round'; ctx.lineJoin = 'round'
            ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        } else if (obj.type === 'shape') {
          const w = obj.width ?? 100, h = obj.height ?? 100
          ctx.strokeStyle = obj.color || '#000'; ctx.lineWidth = obj.strokeWidth || 2
          if (obj.shapeType === 'rectangle') { ctx.strokeRect(0, 0, w, h) }
          else if (obj.shapeType === 'circle') { const r = Math.min(w, h) / 2; ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.stroke() }
          else if (obj.shapeType === 'line') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.stroke() }
          else if (obj.shapeType === 'arrow') {
            const hl = 15, ang = Math.atan2(h, w)
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(w - hl * Math.cos(ang - Math.PI / 6), h - hl * Math.sin(ang - Math.PI / 6))
            ctx.lineTo(w, h)
            ctx.lineTo(w - hl * Math.cos(ang + Math.PI / 6), h - hl * Math.sin(ang + Math.PI / 6))
            ctx.stroke()
          }
        } else if (obj.type === 'text') {
          ctx.fillStyle = obj.color || '#000'; ctx.font = '16px Arial'
          ctx.fillText(obj.data || '', 0, 20)
        } else if (obj.type === 'sticky') {
          const w = obj.width ?? 150, h = obj.height ?? 150
          ctx.fillStyle = obj.fillColor || '#ffff00'; ctx.fillRect(0, 0, w, h)
          ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, w, h)
          ctx.fillStyle = obj.color || '#000'; ctx.font = '14px Arial'
          ctx.fillText(obj.data || '', 10, 25)
        } else if (obj.type === 'image') {
          const src = obj.data || ''
          const cached = imageCache.get(src)
          if (cached) {
            if (cached.complete && cached.naturalWidth > 0) {
              ctx.drawImage(cached, 0, 0, obj.width ?? 100, obj.height ?? 100)
            }
          } else if (src && !cached) {
            const img = new Image(); img.src = src; imageCache.set(src, img)
          }
        }

        // Selection handles
        if (selId === obj.id && (obj.type === 'image' || obj.type === 'shape' || obj.type === 'sticky' || obj.type === 'text')) {
          const w = obj.type === 'text' ? 160 : (obj.width ?? 100)
          const h = obj.type === 'text' ? 28 : (obj.height ?? 100)
          const pad = 10 / v.zoom
          const hs = 14 / v.zoom  // bigger handles for touch
          const r = hs / 2

          // Dashed border
          ctx.strokeStyle = '#6d28d9'; ctx.lineWidth = 1.5 / v.zoom
          ctx.setLineDash([5 / v.zoom, 4 / v.zoom])
          ctx.strokeRect(-pad, -pad, w + pad * 2, h + pad * 2)
          ctx.setLineDash([])

          // Corner resize handles
          const corners: [number, number][] = [
            [-pad - r, -pad - r],
            [w + pad - r, -pad - r],
            [-pad - r, h + pad - r],
            [w + pad - r, h + pad - r],
          ]
          corners.forEach(([cx, cy]) => {
            ctx.fillStyle = '#6d28d9'; ctx.beginPath(); ctx.arc(cx + r, cy + r, r, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + r, cy + r, r * 0.55, 0, Math.PI * 2); ctx.fill()
          })

          // Rotate handle (circle above top-centre)
          const ll = 28 / v.zoom, ccx = w / 2
          ctx.strokeStyle = '#6d28d9'; ctx.lineWidth = 1.5 / v.zoom
          ctx.beginPath(); ctx.moveTo(ccx, -pad); ctx.lineTo(ccx, -pad - ll); ctx.stroke()
          ctx.fillStyle = '#6d28d9'; ctx.beginPath(); ctx.arc(ccx, -pad - ll - r, r, 0, Math.PI * 2); ctx.fill()
          // rotation arrow symbol
          ctx.fillStyle = '#fff'; ctx.font = `bold ${10 / v.zoom}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText('↻', ccx, -pad - ll - r)
          ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'

          // X delete button (top-right outside)
          const xr = 10 / v.zoom
          const xbx = w + pad + xr, xby = -pad - xr
          ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(xbx, xby, xr, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#fff'; ctx.font = `bold ${11 / v.zoom}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText('×', xbx, xby)
          ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
        }
        ctx.restore()
      }

      // Live pen/highlighter preview
      const pts = currentPath.current
      if (pts.length > 1 && isDrawingRef.current) {
        const t = toolRef.current
        ctx.save()
        ctx.translate(v.panX, v.panY); ctx.scale(v.zoom, v.zoom)
        ctx.strokeStyle = colorRef.current
        ctx.lineWidth = t === 'highlighter' ? 8 : 3
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        if (t === 'highlighter') ctx.globalAlpha = 0.4
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
        ctx.stroke(); ctx.globalAlpha = 1
        ctx.restore()
      }

      // Live shape preview
      if (isDrawingRef.current && shapeStart.current && shapeEnd.current) {
        const t = toolRef.current
        const sw = shapeEnd.current.x - shapeStart.current.x
        const sh = shapeEnd.current.y - shapeStart.current.y
        ctx.save()
        ctx.translate(v.panX + shapeStart.current.x * v.zoom, v.panY + shapeStart.current.y * v.zoom)
        ctx.scale(v.zoom, v.zoom)
        ctx.strokeStyle = colorRef.current; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
        if (t === 'rectangle') ctx.strokeRect(0, 0, sw, sh)
        else if (t === 'line' || t === 'arrow') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sw, sh); ctx.stroke() }
        else if (t === 'circle') { const r = Math.min(Math.abs(sw), Math.abs(sh)) / 2; ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.stroke() }
        ctx.setLineDash([])
        ctx.restore()
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, []) // runs once, reads everything from refs

  // ── Resize observer ───────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) { canvas.width = width; canvas.height = height }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // ── Wheel zoom / pan ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        const mx = e.clientX - rect.left, my = e.clientY - rect.top
        const v = viewRef.current
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom * (1 - e.deltaY * 0.001)))
        const cp = screenToCanvas(e.clientX, e.clientY)
        const nv = { panX: mx - cp.x * nz, panY: my - cp.y * nz, zoom: nz }
        viewRef.current = nv; _setView(nv)
      } else {
        const v = viewRef.current
        const nv = { ...v, panX: v.panX - e.deltaX, panY: v.panY - e.deltaY }
        viewRef.current = nv; _setView(nv)
      }
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [screenToCanvas])

  // ── Image upload — stores in Supabase Storage so URL persists ──
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return

    for (const file of files) {
      // 1. Show a local preview immediately while uploading
      const localSrc = await new Promise<string>(res => {
        const reader = new FileReader()
        reader.onload = ev => res(ev.target?.result as string)
        reader.readAsDataURL(file)
      })

      const img = await new Promise<HTMLImageElement>(res => {
        const i = new Image(); i.onload = () => res(i); i.src = localSrc
      })

      const maxW = 600, maxH = 400
      const scale = Math.min(maxW / img.width, maxH / img.height, 1)
      const w = img.width * scale, h = img.height * scale
      const canvas = canvasRef.current
      const v = viewRef.current
      const cx = ((canvas?.width ?? 800) / 2 - v.panX) / v.zoom
      const cy = ((canvas?.height ?? 600) / 2 - v.panY) / v.zoom
      const id = `image-${Date.now()}-${Math.random()}`

      // Add with local base64 so it shows instantly
      imageCache.set(localSrc, img)
      pushHistory()
      commitObjects(prev => [...prev, {
        id, type: 'image',
        x: cx - w / 2, y: cy - h / 2, width: w, height: h,
        rotation: 0, data: localSrc, zIndex: Date.now(),
      }])

      // 2. Upload to Supabase Storage in the background
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${studentId}/whiteboard/${questionId}/${id}.${ext}`
      const { error } = await supabase.storage.from('submissions').upload(path, file, { upsert: true })
      if (error) { console.error('Image upload failed:', error); continue }

      // 3. Get a long-lived signed URL (10 years)
      const { data: signed } = await supabase.storage.from('submissions').createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
      if (!signed?.signedUrl) continue

      const signedUrl = signed.signedUrl

      // 4. Replace the base64 data with the signed URL in the objects list
      const signedImg = new Image(); signedImg.src = signedUrl
      imageCache.set(signedUrl, img) // reuse the already-loaded img element
      commitObjects(prev => prev.map(o => o.id === id ? { ...o, data: signedUrl } : o))
    }
  }, [commitObjects, pushHistory, studentId, questionId])

  // ── Mouse handlers ────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    const { mx, my } = getScreenMouse(e)

    if (e.button === 1 || toolRef.current === 'pan') {
      panStart.current = { x: e.clientX, y: e.clientY }; return
    }

    if (toolRef.current === 'pointer') {
      const v = viewRef.current
      const HIT = 16
      const hit = (hx: number, hy: number) => Math.hypot(mx - hx, my - hy) <= HIT

      const selObj = objsRef.current.find(o => o.id === selIdRef.current)
      if (selObj && ['image', 'shape', 'sticky', 'text'].includes(selObj.type)) {
        const sw = selObj.type === 'text' ? 160 : (selObj.width ?? 100)
        const sh = selObj.type === 'text' ? 28 : (selObj.height ?? 100)
        const sx = v.panX + selObj.x * v.zoom, sy = v.panY + selObj.y * v.zoom
        const swz = sw * v.zoom, shz = sh * v.zoom
        const pad = 10, ll = 28

        // X delete button hit
        const xbx = sx + swz + pad + 10, xby = sy - pad - 10
        if (hit(xbx, xby)) {
          pushHistory()
          commitObjects(prev => prev.filter(o => o.id !== selObj.id))
          selIdRef.current = null; setSelId(null)
          return
        }

        const start = (mode: DragMode) => {
          dragMode.current = mode; dragObjId.current = selObj.id
          dragStartMouse.current = { x: mx, y: my }
          dragStartObj.current = { x: selObj.x, y: selObj.y, width: sw, height: sh, rotation: selObj.rotation }
        }

        if (hit(sx + swz / 2, sy - pad - ll - 10)) { start('rotate'); return }
        if (hit(sx - pad, sy - pad)) { start('resize-nw'); return }
        if (hit(sx + swz + pad, sy - pad)) { start('resize-ne'); return }
        if (hit(sx - pad, sy + shz + pad)) { start('resize-sw'); return }
        if (hit(sx + swz + pad, sy + shz + pad)) { start('resize-se'); return }
        if (mx >= sx - pad && mx <= sx + swz + pad && my >= sy - pad && my <= sy + shz + pad) { start('move'); return }
      }

      const hitObj = [...objsRef.current].reverse().find(o => {
        if (!['image', 'shape', 'sticky', 'text'].includes(o.type)) return false
        const v2 = viewRef.current
        const sw = o.type === 'text' ? 160 : (o.width ?? 100)
        const sh = o.type === 'text' ? 28 : (o.height ?? 100)
        const sx = v2.panX + o.x * v2.zoom, sy = v2.panY + o.y * v2.zoom
        return mx >= sx && mx <= sx + sw * v2.zoom && my >= sy && my <= sy + sh * v2.zoom
      })

      selIdRef.current = hitObj?.id ?? null
      setSelId(hitObj?.id ?? null)
      if (hitObj) {
        const sw = hitObj.type === 'text' ? 160 : (hitObj.width ?? 100)
        const sh = hitObj.type === 'text' ? 28 : (hitObj.height ?? 100)
        dragMode.current = 'move'; dragObjId.current = hitObj.id
        dragStartMouse.current = { x: mx, y: my }
        dragStartObj.current = { x: hitObj.x, y: hitObj.y, width: sw, height: sh, rotation: hitObj.rotation }
      }
      return
    }

    if (toolRef.current === 'pen' || toolRef.current === 'highlighter' || toolRef.current === 'eraser') {
      isDrawingRef.current = true
      currentPath.current = [canvasPos]
    } else if (['rectangle', 'circle', 'line', 'arrow'].includes(toolRef.current)) {
      isDrawingRef.current = true
      shapeStart.current = canvasPos; shapeEnd.current = canvasPos
    } else if (toolRef.current === 'text') {
      pushHistory()
      commitObjects(prev => [...prev, { id: `text-${Date.now()}`, type: 'text', x: canvasPos.x, y: canvasPos.y, rotation: 0, data: 'Text...', color: colorRef.current, zIndex: Date.now() }])
    } else if (toolRef.current === 'sticky') {
      pushHistory()
      commitObjects(prev => [...prev, { id: `sticky-${Date.now()}`, type: 'sticky', x: canvasPos.x, y: canvasPos.y, width: 150, height: 150, rotation: 0, data: 'Note...', fillColor: '#ffff00', color: '#000', zIndex: Date.now() }])
    }
  }, [screenToCanvas, commitObjects, pushHistory])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (panStart.current) {
      const dx = e.clientX - panStart.current.x, dy = e.clientY - panStart.current.y
      const v = viewRef.current
      const nv = { ...v, panX: v.panX + dx, panY: v.panY + dy }
      viewRef.current = nv; _setView(nv)
      panStart.current = { x: e.clientX, y: e.clientY }
      return
    }

    if (dragMode.current && dragObjId.current && dragStartMouse.current && dragStartObj.current) {
      const { mx, my } = getScreenMouse(e)
      const v = viewRef.current
      const dx = (mx - dragStartMouse.current.x) / v.zoom
      const dy = (my - dragStartMouse.current.y) / v.zoom
      const s = dragStartObj.current
      const MIN = 20

      commitObjects(prev => prev.map(obj => {
        if (obj.id !== dragObjId.current) return obj
        switch (dragMode.current) {
          case 'move': return { ...obj, x: s.x + dx, y: s.y + dy }
          case 'resize-se': return { ...obj, width: Math.max(MIN, s.width + dx), height: Math.max(MIN, s.height + dy) }
          case 'resize-sw': { const nw = Math.max(MIN, s.width - dx); return { ...obj, x: s.x + s.width - nw, width: nw, height: Math.max(MIN, s.height + dy) } }
          case 'resize-ne': { const nh = Math.max(MIN, s.height - dy); return { ...obj, y: s.y + s.height - nh, width: Math.max(MIN, s.width + dx), height: nh } }
          case 'resize-nw': { const nw = Math.max(MIN, s.width - dx), nh = Math.max(MIN, s.height - dy); return { ...obj, x: s.x + s.width - nw, y: s.y + s.height - nh, width: nw, height: nh } }
          case 'rotate': {
            const csx = v.panX + (s.x + s.width / 2) * v.zoom
            const csy = v.panY + (s.y + s.height / 2) * v.zoom
            return { ...obj, rotation: Math.atan2(my - csy, mx - csx) * 180 / Math.PI + 90 }
          }
          default: return obj
        }
      }))
      return
    }

    if (!isDrawingRef.current) return
    const cp = screenToCanvas(e.clientX, e.clientY)
    if (toolRef.current === 'pen' || toolRef.current === 'highlighter') {
      currentPath.current.push(cp)
    } else if (toolRef.current === 'eraser') {
      const RADIUS = 20 / viewRef.current.zoom
      commitObjects(prev => prev.filter(obj => {
        if (obj.type === 'pen' || obj.type === 'highlighter') {
          const pts = JSON.parse(obj.data || '[]') as { x: number; y: number }[]
          return !pts.some(p => Math.hypot(p.x - cp.x, p.y - cp.y) < RADIUS)
        }
        return true
      }))
    } else if (['rectangle', 'circle', 'line', 'arrow'].includes(toolRef.current)) {
      shapeEnd.current = cp
    }
  }, [screenToCanvas, commitObjects])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    panStart.current = null

    if (dragMode.current && dragObjId.current) pushHistory()
    dragMode.current = null; dragObjId.current = null
    dragStartMouse.current = null; dragStartObj.current = null

    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    const t = toolRef.current
    if (t === 'pen' || t === 'highlighter') {
      if (currentPath.current.length > 1) {
        pushHistory()
        commitObjects(prev => [...prev, {
          id: `${t}-${Date.now()}`, type: t,
          x: 0, y: 0, rotation: 0,
          data: JSON.stringify(currentPath.current),
          color: colorRef.current,
          strokeWidth: t === 'highlighter' ? 8 : 3,
          zIndex: Date.now(),
        }])
      }
      currentPath.current = []
    } else if (['rectangle', 'circle', 'line', 'arrow'].includes(t)) {
      if (shapeStart.current && shapeEnd.current) {
        const w = Math.abs(shapeEnd.current.x - shapeStart.current.x)
        const h = Math.abs(shapeEnd.current.y - shapeStart.current.y)
        if (w > 5 || h > 5) {
          pushHistory()
          commitObjects(prev => [...prev, {
            id: `shape-${Date.now()}`, type: 'shape',
            x: Math.min(shapeStart.current!.x, shapeEnd.current!.x),
            y: Math.min(shapeStart.current!.y, shapeEnd.current!.y),
            width: w, height: h, rotation: 0,
            color: colorRef.current, strokeWidth: 2,
            shapeType: t as 'rectangle' | 'circle' | 'line' | 'arrow',
            zIndex: Date.now(),
          }])
        }
      }
      shapeStart.current = null; shapeEnd.current = null
    }
  }, [commitObjects, pushHistory])

  // ── Touch handlers (native, non-passive for no lag) ──────────
  const pinchStartDist = useRef<number | null>(null)
  const pinchStartZoom = useRef<number>(1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        pinchStartDist.current = Math.hypot(dx, dy)
        pinchStartZoom.current = viewRef.current.zoom
        return
      }
      if (e.touches.length === 1) {
        const t = e.touches[0]
        const canvasPos = screenToCanvas(t.clientX, t.clientY)
        const rect = containerRef.current?.getBoundingClientRect()
        const mx = t.clientX - (rect?.left ?? 0)
        const my = t.clientY - (rect?.top ?? 0)

        if (toolRef.current === 'pan') {
          panStart.current = { x: t.clientX, y: t.clientY }; return
        }
        if (toolRef.current === 'pen' || toolRef.current === 'highlighter' || toolRef.current === 'eraser') {
          isDrawingRef.current = true
          currentPath.current = [canvasPos]
        } else if (['rectangle', 'circle', 'line', 'arrow'].includes(toolRef.current)) {
          isDrawingRef.current = true
          shapeStart.current = canvasPos; shapeEnd.current = canvasPos
        } else if (toolRef.current === 'pointer') {
          const v = viewRef.current
          const HIT = 22
          const hit = (hx: number, hy: number) => Math.hypot(mx - hx, my - hy) <= HIT
          const selObj = objsRef.current.find(o => o.id === selIdRef.current)
          if (selObj && ['image', 'shape', 'sticky', 'text'].includes(selObj.type)) {
            const sw = selObj.type === 'text' ? 160 : (selObj.width ?? 100)
            const sh = selObj.type === 'text' ? 28 : (selObj.height ?? 100)
            const sx = v.panX + selObj.x * v.zoom, sy = v.panY + selObj.y * v.zoom
            const swz = sw * v.zoom, shz = sh * v.zoom
            const pad = 10, ll = 28
            // X delete button
            const xbx = sx + swz + pad + 10, xby = sy - pad - 10
            if (hit(xbx, xby)) {
              pushHistory()
              commitObjects(prev => prev.filter(o => o.id !== selObj.id))
              selIdRef.current = null; setSelId(null); return
            }
            const start = (mode: DragMode) => {
              dragMode.current = mode; dragObjId.current = selObj.id
              dragStartMouse.current = { x: mx, y: my }
              dragStartObj.current = { x: selObj.x, y: selObj.y, width: sw, height: sh, rotation: selObj.rotation }
            }
            if (hit(sx + swz / 2, sy - pad - ll - 10)) { start('rotate'); return }
            if (hit(sx - pad, sy - pad)) { start('resize-nw'); return }
            if (hit(sx + swz + pad, sy - pad)) { start('resize-ne'); return }
            if (hit(sx - pad, sy + shz + pad)) { start('resize-sw'); return }
            if (hit(sx + swz + pad, sy + shz + pad)) { start('resize-se'); return }
            if (mx >= sx - pad && mx <= sx + swz + pad && my >= sy - pad && my <= sy + shz + pad) { start('move'); return }
          }
          const hitObj = [...objsRef.current].reverse().find(o => {
            if (!['image', 'shape', 'sticky', 'text'].includes(o.type)) return false
            const sw = o.type === 'text' ? 160 : (o.width ?? 100)
            const sh = o.type === 'text' ? 28 : (o.height ?? 100)
            const sx = v.panX + o.x * v.zoom, sy = v.panY + o.y * v.zoom
            return mx >= sx && mx <= sx + sw * v.zoom && my >= sy && my <= sy + sh * v.zoom
          })
          selIdRef.current = hitObj?.id ?? null; setSelId(hitObj?.id ?? null)
          if (hitObj) {
            const sw = hitObj.type === 'text' ? 160 : (hitObj.width ?? 100)
            const sh = hitObj.type === 'text' ? 28 : (hitObj.height ?? 100)
            dragMode.current = 'move'; dragObjId.current = hitObj.id
            dragStartMouse.current = { x: mx, y: my }
            dragStartObj.current = { x: hitObj.x, y: hitObj.y, width: sw, height: sh, rotation: hitObj.rotation }
          }
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 2 && pinchStartDist.current !== null) {
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        const dist = Math.hypot(dx, dy)
        const scale = dist / pinchStartDist.current
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
        const cp = screenToCanvas(midX, midY)
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStartZoom.current * scale))
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const nv = { panX: (midX - rect.left) - cp.x * nz, panY: (midY - rect.top) - cp.y * nz, zoom: nz }
          viewRef.current = nv; _setView(nv)
        }
        return
      }
      if (e.touches.length === 1) {
        const t = e.touches[0]
        const cp = screenToCanvas(t.clientX, t.clientY)
        const rect = containerRef.current?.getBoundingClientRect()
        const mx = t.clientX - (rect?.left ?? 0)
        const my = t.clientY - (rect?.top ?? 0)

        if (panStart.current) {
          const dx = t.clientX - panStart.current.x, dy = t.clientY - panStart.current.y
          const v = viewRef.current
          const nv = { ...v, panX: v.panX + dx, panY: v.panY + dy }
          viewRef.current = nv; _setView(nv)
          panStart.current = { x: t.clientX, y: t.clientY }
          return
        }
        if (dragMode.current && dragObjId.current && dragStartMouse.current && dragStartObj.current) {
          const v = viewRef.current
          const dx = (mx - dragStartMouse.current.x) / v.zoom
          const dy = (my - dragStartMouse.current.y) / v.zoom
          const s = dragStartObj.current
          const MIN = 20
          commitObjects(prev => prev.map(obj => {
            if (obj.id !== dragObjId.current) return obj
            switch (dragMode.current) {
              case 'move': return { ...obj, x: s.x + dx, y: s.y + dy }
              case 'resize-se': return { ...obj, width: Math.max(MIN, s.width + dx), height: Math.max(MIN, s.height + dy) }
              case 'resize-sw': { const nw = Math.max(MIN, s.width - dx); return { ...obj, x: s.x + s.width - nw, width: nw, height: Math.max(MIN, s.height + dy) } }
              case 'resize-ne': { const nh = Math.max(MIN, s.height - dy); return { ...obj, y: s.y + s.height - nh, width: Math.max(MIN, s.width + dx), height: nh } }
              case 'resize-nw': { const nw = Math.max(MIN, s.width - dx), nh = Math.max(MIN, s.height - dy); return { ...obj, x: s.x + s.width - nw, y: s.y + s.height - nh, width: nw, height: nh } }
              case 'rotate': {
                const csx = v.panX + (s.x + s.width / 2) * v.zoom
                const csy = v.panY + (s.y + s.height / 2) * v.zoom
                return { ...obj, rotation: Math.atan2(my - csy, mx - csx) * 180 / Math.PI + 90 }
              }
              default: return obj
            }
          }))
          return
        }
        if (!isDrawingRef.current) return
        if (toolRef.current === 'pen' || toolRef.current === 'highlighter') {
          currentPath.current.push(cp)
        } else if (toolRef.current === 'eraser') {
          const RADIUS = 20 / viewRef.current.zoom
          commitObjects(prev => prev.filter(obj => {
            if (obj.type === 'pen' || obj.type === 'highlighter') {
              const pts = JSON.parse(obj.data || '[]') as { x: number; y: number }[]
              return !pts.some(p => Math.hypot(p.x - cp.x, p.y - cp.y) < RADIUS)
            }
            return true
          }))
        } else if (['rectangle', 'circle', 'line', 'arrow'].includes(toolRef.current)) {
          shapeEnd.current = cp
        }
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      pinchStartDist.current = null
      panStart.current = null
      if (dragMode.current && dragObjId.current) pushHistory()
      dragMode.current = null; dragObjId.current = null
      dragStartMouse.current = null; dragStartObj.current = null

      if (!isDrawingRef.current) return
      isDrawingRef.current = false
      const t = toolRef.current
      if (t === 'pen' || t === 'highlighter') {
        if (currentPath.current.length > 1) {
          pushHistory()
          commitObjects(prev => [...prev, {
            id: `${t}-${Date.now()}`, type: t,
            x: 0, y: 0, rotation: 0,
            data: JSON.stringify(currentPath.current),
            color: colorRef.current,
            strokeWidth: t === 'highlighter' ? 8 : 3,
            zIndex: Date.now(),
          }])
        }
        currentPath.current = []
      } else if (['rectangle', 'circle', 'line', 'arrow'].includes(t)) {
        if (shapeStart.current && shapeEnd.current) {
          const w = Math.abs(shapeEnd.current.x - shapeStart.current.x)
          const h = Math.abs(shapeEnd.current.y - shapeStart.current.y)
          if (w > 5 || h > 5) {
            pushHistory()
            commitObjects(prev => [...prev, {
              id: `shape-${Date.now()}`, type: 'shape',
              x: Math.min(shapeStart.current!.x, shapeEnd.current!.x),
              y: Math.min(shapeStart.current!.y, shapeEnd.current!.y),
              width: w, height: h, rotation: 0,
              color: colorRef.current, strokeWidth: 2,
              shapeType: t as 'rectangle' | 'circle' | 'line' | 'arrow',
              zIndex: Date.now(),
            }])
          }
        }
        shapeStart.current = null; shapeEnd.current = null
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [screenToCanvas, commitObjects, pushHistory])

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable)
    }
    const onDown = (e: KeyboardEvent) => {
      if (isTyping()) return
      if (e.code === 'Space') { e.preventDefault(); setTool('pan') }
      else if (e.key === 'Escape') { selIdRef.current = null; setSelId(null) }
      else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); e.shiftKey ? doRedo() : doUndo()
      }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selIdRef.current) {
        pushHistory()
        commitObjects(prev => prev.filter(o => o.id !== selIdRef.current))
        selIdRef.current = null; setSelId(null)
      }
    }
    const onUp = (e: KeyboardEvent) => { if (!isTyping() && e.code === 'Space') setTool('pen') }
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [doUndo, doRedo, commitObjects, pushHistory])

  // ── Realtime ──────────────────────────────────────────────────
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const broadcastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const theirEvent = role === 'student' ? 'teacher_objects' : 'student_objects'
    const ch = supabase.channel(`wb:${questionId}:${studentId}`)
    ch.on('broadcast', { event: theirEvent }, ({ payload }) => {
      const incoming = (payload.objects as DrawObject[]) ?? []
      remoteObjsRef.current = incoming
      setLiveIndicator(true)
      if (liveTimer.current) clearTimeout(liveTimer.current)
      liveTimer.current = setTimeout(() => setLiveIndicator(false), 3000)
    })
    ch.subscribe(); channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [questionId, studentId, role])

  // Broadcast on object changes (debounced, skip images to avoid size limit)
  useEffect(() => {
    if (broadcastTimer.current) clearTimeout(broadcastTimer.current)
    broadcastTimer.current = setTimeout(() => {
      const myEvent = role === 'student' ? 'student_objects' : 'teacher_objects'
      const broadcastable = objsRef.current.filter(o => o.type !== 'image')
      channelRef.current?.send({ type: 'broadcast', event: myEvent, payload: { objects: broadcastable } })
    }, 150)
  }, [objCount, role])

  // ── Auto-save ─────────────────────────────────────────────────
  const doSave = useCallback(async () => {
    if (!onSaveStudent && !onSaveTeacher) return
    setSaveStatus('saving')
    try {
      const json = JSON.stringify(objsRef.current)
      if (role === 'student' && onSaveStudent) await onSaveStudent(json)
      else if (role === 'teacher' && onSaveTeacher) await onSaveTeacher(json)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Save failed:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [role, onSaveStudent, onSaveTeacher])

  useEffect(() => {
    if (!onSaveStudent && !onSaveTeacher) return
    const id = setInterval(doSave, 8000)
    return () => clearInterval(id)
  }, [doSave, onSaveStudent, onSaveTeacher])

  // ── Toolbar helper ────────────────────────────────────────────
  const tb = (t: Tool, label: string) => (
    <button key={t} onClick={() => setTool(t)}
      className={`px-3 py-2 rounded text-sm font-medium transition-all whitespace-nowrap ${tool === t ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
      {label}
    </button>
  )

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex gap-1.5 items-center overflow-x-auto flex-shrink-0 bg-white">
        {tb('pointer', '➤ Select')}
        {tb('pan', '✋ Pan')}
        {tb('pen', '✏️ Pen')}
        {tb('highlighter', '🔆 Highlight')}
        {tb('eraser', '⬜ Erase')}
        {tb('text', '𝐓 Text')}
        <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
        {tb('rectangle', '▭ Box')}
        {tb('circle', '● Circle')}
        {tb('line', '╱ Line')}
        {tb('arrow', '→ Arrow')}
        {tb('sticky', '📝 Sticky')}
        <button onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 whitespace-nowrap">
          🖼 Image
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer flex-shrink-0" />
        {liveIndicator && (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium animate-pulse whitespace-nowrap">
            ● {role === 'student' ? 'Teacher is drawing' : 'Student is drawing'}
          </span>
        )}
        <div className="ml-auto flex gap-1.5 items-center flex-shrink-0">
          {objCount > 0 && (
            <button onClick={() => { pushHistory(); commitObjects(() => []); selIdRef.current = null }}
              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm font-medium whitespace-nowrap">
              🗑 Clear all
            </button>
          )}
          {selId && (
            <button onClick={() => { pushHistory(); commitObjects(prev => prev.filter(o => o.id !== selIdRef.current)); selIdRef.current = null; setSelId(null) }}
              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium whitespace-nowrap">
              🗑 Delete
            </button>
          )}
          <button onClick={doUndo} title="Undo (Ctrl+Z)" className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">↩ Undo</button>
          <button onClick={doRedo} title="Redo (Ctrl+Shift+Z)" className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">↪ Redo</button>
          <div className="w-px h-5 bg-gray-200" />
          <button onClick={() => { const v = viewRef.current; const nv = { ...v, zoom: Math.max(MIN_ZOOM, v.zoom - 0.1) }; viewRef.current = nv; _setView(nv) }}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">−</button>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium min-w-[52px] text-center">{Math.round(view.zoom * 100)}%</span>
          <button onClick={() => { const v = viewRef.current; const nv = { ...v, zoom: Math.min(MAX_ZOOM, v.zoom + 0.1) }; viewRef.current = nv; _setView(nv) }}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">+</button>
          <button onClick={() => { viewRef.current = { panX: 0, panY: 0, zoom: 1 }; _setView({ panX: 0, panY: 0, zoom: 1 }) }}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">Reset</button>
          {(onSaveStudent || onSaveTeacher) && (
            <button onClick={doSave} disabled={saveStatus === 'saving'}
              className={`px-3 py-1.5 rounded text-sm font-semibold text-white transition-all disabled:opacity-60 ${saveStatus === 'saved' ? 'bg-green-500' : saveStatus === 'error' ? 'bg-red-500' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '✗ Failed' : '💾 Save'}
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-white">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none"
          style={{ cursor: tool === 'pointer' ? 'default' : tool === 'pan' ? 'grab' : 'crosshair' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="border-t border-gray-200 px-4 py-1 text-xs text-gray-400 flex justify-between bg-white">
        <span>Objects: {objCount}</span>
        <span>Scroll to pan · Ctrl+Scroll to zoom · Select tool to move/resize/rotate · Delete key to remove</span>
      </div>
    </div>
  )
}
