'use client'

import { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react'

export interface ScratchBoardHandle {
  getSnapshot: () => string | null
}

type Tool = 'pen' | 'highlighter' | 'eraser' | 'pan'

interface StrokeObject {
  kind: 'stroke'
  tool: 'pen' | 'highlighter' | 'eraser'
  color: string
  width: number
  points: { x: number; y: number }[]
}
interface ImageObject {
  kind: 'image'
  x: number
  y: number
  width: number
  height: number
  src: string
}
type BoardObject = StrokeObject | ImageObject

interface ViewState { panX: number; panY: number; zoom: number }

const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

// Bounding box (world coords) enclosing every object — used to export a
// flattened PNG that captures everything drawn, regardless of the current
// pan/zoom the student or teacher happened to be looking at when the
// snapshot was taken.
function contentBounds(objs: BoardObject[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const o of objs) {
    if (o.kind === 'stroke') {
      for (const p of o.points) {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
      }
    } else {
      if (o.x < minX) minX = o.x
      if (o.y < minY) minY = o.y
      if (o.x + o.width > maxX) maxX = o.x + o.width
      if (o.y + o.height > maxY) maxY = o.y + o.height
    }
  }
  if (!isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

// A self-contained pan/zoom canvas for self-study and test FRQ questions —
// not the full InfiniteWhiteboard (which is tightly coupled to realtime
// channels and Supabase Storage paths keyed by questionId+studentId for the
// REAL assigned-work board; reusing it here would collide with that same
// student's actual submission for this question). Same pen/highlighter/
// eraser/zoom/pan/undo/redo/image-insert feel as that board, but entirely
// local state, exported as a single flattened PNG data URL on demand via
// the ref — no realtime sync, no storage upload.
//
// Input/render architecture is deliberately copied from InfiniteWhiteboard
// (which students never had writing trouble with on iPad), rather than the
// Pointer Events + draw-on-every-event approach this used to use: native
// touchstart/touchmove/touchend for touch/pencil (Safari's Pointer Events
// have historically been the less reliable of the two for fast continuous
// drawing), a continuous requestAnimationFrame loop that repaints from refs
// every frame regardless of event rate (so drawing cost is capped at the
// display's refresh rate, not the touch event rate), and a canvas whose
// raster resolution is kept in sync with its actual rendered pixel size via
// ResizeObserver (the old fixed 640×320 raster stretched via CSS to
// whatever width the container rendered at, softening precision on a large
// iPad screen).
const ScratchBoard = forwardRef<ScratchBoardHandle, { initialDataUrl?: string | null; label?: string; penColor?: string; width?: number; height?: number }>(function ScratchBoard(
  { initialDataUrl, label = '✏️ Work it out here', penColor = '#111827', width = 640, height = 320 }, ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())

  const objectsRef = useRef<BoardObject[]>([])
  const history = useRef<BoardObject[][]>([])
  const redoStack = useRef<BoardObject[][]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const syncUndoRedo = () => { setCanUndo(history.current.length > 0); setCanRedo(redoStack.current.length > 0) }

  const viewRef = useRef<ViewState>({ panX: 0, panY: 0, zoom: 1 })
  const [view, _setView] = useState<ViewState>({ panX: 0, panY: 0, zoom: 1 })
  const setView = (v: ViewState) => { viewRef.current = v; _setView(v) }

  const [tool, _setTool] = useState<Tool>('pen')
  const toolRef = useRef<Tool>('pen')
  function setTool(t: Tool) { toolRef.current = t; _setTool(t) }

  const drawing = useRef(false)
  const currentPath = useRef<{ x: number; y: number }[]>([])
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null)

  // No copying needed: every mutation site below REASSIGNS objectsRef.current
  // to a brand-new array (spread or []) rather than mutating the existing
  // one in place, so the reference captured here stays valid forever — same
  // assumption undo()/redo() already rely on.
  const pushHistory = useCallback(() => {
    history.current.push(objectsRef.current)
    if (history.current.length > 50) history.current.shift()
    redoStack.current = []
    syncUndoRedo()
  }, [])

  // ── Continuous render loop — reads straight from refs every frame, so
  // drawing cost is capped at the display's refresh rate regardless of how
  // fast touch/pencil events arrive (see the component comment above). ──
  useEffect(() => {
    let rafId: number
    const loop = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx || canvas.width === 0 || canvas.height === 0) { rafId = requestAnimationFrame(loop); return }
      const v = viewRef.current

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.translate(v.panX, v.panY)
      ctx.scale(v.zoom, v.zoom)

      const drawStroke = (s: StrokeObject) => {
        if (s.points.length < 2) return
        if (s.tool === 'highlighter') {
          ctx.globalAlpha = 0.4
          ctx.globalCompositeOperation = 'multiply'
        } else {
          ctx.globalAlpha = 1
          ctx.globalCompositeOperation = 'source-over'
        }
        ctx.strokeStyle = s.color
        ctx.lineWidth = s.width
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(s.points[0].x, s.points[0].y)
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y)
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
      }

      for (const obj of objectsRef.current) {
        if (obj.kind === 'stroke') {
          drawStroke(obj)
        } else {
          const img = imageCache.current.get(obj.src)
          if (img?.complete && img.naturalWidth > 0) ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height)
        }
      }

      // The in-progress stroke isn't committed to objectsRef until the
      // gesture ends, so it's drawn separately here to stay visible while
      // actively drawing.
      if (drawing.current && currentPath.current.length > 1) {
        drawStroke({
          kind: 'stroke',
          tool: toolRef.current === 'pan' ? 'pen' : toolRef.current,
          color: toolRef.current === 'eraser' ? '#ffffff' : toolRef.current === 'highlighter' ? '#fde047' : penColor,
          width: toolRef.current === 'eraser' ? 22 : toolRef.current === 'highlighter' ? 14 : 2.5,
          points: currentPath.current,
        })
      }

      ctx.restore()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [penColor])

  // ── Canvas resolution tracks its actual rendered pixel size, not a fixed
  // raster stretched via CSS — keeps drawing crisp and touch coordinates
  // precise at whatever size this ends up rendering at. ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Set synchronously from the current layout rather than waiting on the
    // observer's first (inherently async) callback, so there's never a
    // frame rendered at the browser's 300×150 canvas default before the
    // real size is known.
    const rect = canvas.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) { canvas.width = rect.width; canvas.height = rect.height }
    const ro = new ResizeObserver(entries => {
      const { width: w, height: h } = entries[0].contentRect
      if (w > 0 && h > 0) { canvas.width = w; canvas.height = h }
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  // ── Load starting content (a prior save) as a single image object ──
  useEffect(() => {
    objectsRef.current = []
    history.current = []
    redoStack.current = []
    syncUndoRedo()
    if (initialDataUrl) {
      const img = new Image()
      img.onload = () => {
        imageCache.current.set(initialDataUrl, img)
        objectsRef.current = [{ kind: 'image', x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight, src: initialDataUrl }]
      }
      img.src = initialDataUrl
    }
  }, [initialDataUrl])

  // ── Export: flatten every object into one PNG sized to fit them all,
  // independent of whatever the current pan/zoom happens to be. ──
  useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      const objs = objectsRef.current
      if (objs.length === 0) return null
      const b = contentBounds(objs)
      if (!b) return null
      const pad = 16
      const rawW = b.maxX - b.minX + pad * 2
      const rawH = b.maxY - b.minY + pad * 2
      const MAX_DIM = 2000
      const scale = Math.min(1, MAX_DIM / Math.max(rawW, rawH))
      const out = document.createElement('canvas')
      out.width = Math.max(1, Math.round(rawW * scale))
      out.height = Math.max(1, Math.round(rawH * scale))
      const ctx = out.getContext('2d')
      if (!ctx) return null
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, out.width, out.height)
      ctx.scale(scale, scale)
      ctx.translate(pad - b.minX, pad - b.minY)
      for (const obj of objs) {
        if (obj.kind === 'stroke') {
          if (obj.points.length < 2) continue
          if (obj.tool === 'highlighter') { ctx.globalAlpha = 0.4; ctx.globalCompositeOperation = 'multiply' }
          else { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over' }
          ctx.strokeStyle = obj.color
          ctx.lineWidth = obj.width
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          ctx.moveTo(obj.points[0].x, obj.points[0].y)
          for (let i = 1; i < obj.points.length; i++) ctx.lineTo(obj.points[i].x, obj.points[i].y)
          ctx.stroke()
          ctx.globalAlpha = 1
          ctx.globalCompositeOperation = 'source-over'
        } else {
          const img = imageCache.current.get(obj.src)
          if (img?.complete && img.naturalWidth > 0) ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height)
        }
      }
      return out.toDataURL('image/png')
    },
  }), [])

  // ── Coordinates: client (screen) → world, accounting for pan/zoom. Canvas
  // raster now matches its own rendered size 1:1 (see the ResizeObserver
  // above), so no CSS-stretch scale correction is needed here anymore. ──
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const rect = canvas?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0, px: 0, py: 0 }
    const px = clientX - rect.left
    const py = clientY - rect.top
    const v = viewRef.current
    return { x: (px - v.panX) / v.zoom, y: (py - v.panY) / v.zoom, px, py }
  }, [])

  const beginStroke = useCallback((p: { x: number; y: number }) => {
    drawing.current = true
    currentPath.current = [p]
  }, [])

  const commitStroke = useCallback(() => {
    if (drawing.current && currentPath.current.length > 1) {
      pushHistory()
      const t = toolRef.current === 'pan' ? 'pen' : toolRef.current
      objectsRef.current = [...objectsRef.current, {
        kind: 'stroke',
        tool: t,
        color: t === 'eraser' ? '#ffffff' : t === 'highlighter' ? '#fde047' : penColor,
        width: t === 'eraser' ? 22 : t === 'highlighter' ? 14 : 2.5,
        points: currentPath.current,
      }]
    }
    drawing.current = false
    currentPath.current = []
  }, [penColor, pushHistory])

  // ── Touch input — native listeners (not React's Pointer Events props),
  // matching InfiniteWhiteboard. Two fingers pinch-zooms; one finger draws
  // or pans depending on the active tool. ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        pinchStart.current = { dist: Math.hypot(dx, dy), zoom: viewRef.current.zoom }
        drawing.current = false
        currentPath.current = []
        return
      }
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      const p = screenToWorld(t.clientX, t.clientY)
      if (toolRef.current === 'pan') {
        panStart.current = { x: p.px, y: p.py, panX: viewRef.current.panX, panY: viewRef.current.panY }
        return
      }
      beginStroke({ x: p.x, y: p.y })
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (e.touches.length === 2 && pinchStart.current) {
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        const dist = Math.hypot(dx, dy)
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
        const rect = canvas!.getBoundingClientRect()
        const mx = midX - rect.left, my = midY - rect.top
        const v = viewRef.current
        const worldX = (mx - v.panX) / v.zoom, worldY = (my - v.panY) / v.zoom
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStart.current.zoom * (dist / pinchStart.current.dist)))
        setView({ zoom: nz, panX: mx - worldX * nz, panY: my - worldY * nz })
        return
      }
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      const p = screenToWorld(t.clientX, t.clientY)
      if (panStart.current) {
        setView({ ...viewRef.current, panX: panStart.current.panX + (p.px - panStart.current.x), panY: panStart.current.panY + (p.py - panStart.current.y) })
        return
      }
      if (!drawing.current) return
      currentPath.current = [...currentPath.current, { x: p.x, y: p.y }]
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault()
      pinchStart.current = null
      panStart.current = null
      commitStroke()
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false })
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [screenToWorld, beginStroke, commitStroke])

  // ── Mouse input (desktop). Tracked on window while a drag is in
  // progress, rather than only via onMouseMove/onMouseUp on the canvas
  // itself, so a drag never silently cuts off the instant the cursor drifts
  // outside the canvas mid-stroke. ──
  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const p = screenToWorld(e.clientX, e.clientY)
    if (toolRef.current === 'pan') {
      panStart.current = { x: p.px, y: p.py, panX: viewRef.current.panX, panY: viewRef.current.panY }
    } else {
      beginStroke({ x: p.x, y: p.y })
    }

    function onWindowMouseMove(ev: MouseEvent) {
      const wp = screenToWorld(ev.clientX, ev.clientY)
      if (panStart.current) {
        setView({ ...viewRef.current, panX: panStart.current.panX + (wp.px - panStart.current.x), panY: panStart.current.panY + (wp.py - panStart.current.y) })
        return
      }
      if (!drawing.current) return
      currentPath.current = [...currentPath.current, { x: wp.x, y: wp.y }]
    }
    function onWindowMouseUp() {
      panStart.current = null
      commitStroke()
      window.removeEventListener('mousemove', onWindowMouseMove)
      window.removeEventListener('mouseup', onWindowMouseUp)
    }
    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('mouseup', onWindowMouseUp)
  }

  function clear() {
    if (objectsRef.current.length === 0) return
    pushHistory()
    objectsRef.current = []
  }

  function undo() {
    if (!history.current.length) return
    redoStack.current.push(objectsRef.current)
    objectsRef.current = history.current.pop()!
    syncUndoRedo()
  }

  function redo() {
    if (!redoStack.current.length) return
    history.current.push(objectsRef.current)
    objectsRef.current = redoStack.current.pop()!
    syncUndoRedo()
  }

  function zoomBy(delta: number) {
    const v = viewRef.current
    const canvas = canvasRef.current
    const cx = (canvas?.width ?? width) / 2, cy = (canvas?.height ?? height) / 2
    const worldCx = (cx - v.panX) / v.zoom, worldCy = (cy - v.panY) / v.zoom
    const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom + delta))
    setView({ zoom: nz, panX: cx - worldCx * nz, panY: cy - worldCy * nz })
  }

  function resetView() {
    setView({ panX: 0, panY: 0, zoom: 1 })
  }

  // Ctrl/Cmd+wheel zooms around the cursor — plain wheel is left alone so
  // scrolling the surrounding page still works normally while the pointer
  // happens to be over the board.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const rect = canvas!.getBoundingClientRect()
      const px = e.clientX - rect.left, py = e.clientY - rect.top
      const v = viewRef.current
      const worldX = (px - v.panX) / v.zoom, worldY = (py - v.panY) / v.zoom
      const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.zoom * (1 - e.deltaY * 0.001)))
      setView({ zoom: nz, panX: px - worldX * nz, panY: py - worldY * nz })
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const dataUrl = await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = ev => resolve(ev.target?.result as string)
      reader.readAsDataURL(file)
    })
    const img = new Image()
    img.onload = () => {
      imageCache.current.set(dataUrl, img)
      const canvas = canvasRef.current
      const cw = canvas?.width ?? width, ch = canvas?.height ?? height
      const maxW = cw * 0.7, maxH = ch * 0.7
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale
      const v = viewRef.current
      const cx = (cw / 2 - v.panX) / v.zoom
      const cy = (ch / 2 - v.panY) / v.zoom
      pushHistory()
      objectsRef.current = [...objectsRef.current, { kind: 'image', x: cx - w / 2, y: cy - h / 2, width: w, height: h, src: dataUrl }]
    }
    img.src = dataUrl
  }

  const toolBtnCls = (active: boolean) =>
    `text-sm px-2 py-1 rounded-md transition-colors ${active ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`
  const iconBtnCls = (disabled: boolean) =>
    `text-sm px-2 py-1 rounded-md transition-colors ${disabled ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex-wrap gap-1.5">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <div className="flex items-center gap-1 flex-wrap">
          <button type="button" onClick={() => setTool('pen')} title="Pen" className={toolBtnCls(tool === 'pen')}>✏️</button>
          <button type="button" onClick={() => setTool('highlighter')} title="Highlighter" className={toolBtnCls(tool === 'highlighter')}>🖍️</button>
          <button type="button" onClick={() => setTool('eraser')} title="Eraser" className={toolBtnCls(tool === 'eraser')}>🧹</button>
          <button type="button" onClick={() => setTool('pan')} title="Pan (drag to move around)" className={toolBtnCls(tool === 'pan')}>✋</button>
          <span className="w-px h-4 bg-gray-200 mx-0.5" />
          <button type="button" onClick={() => zoomBy(-ZOOM_STEP)} title="Zoom out" className={iconBtnCls(false)}>➖</button>
          <button type="button" onClick={resetView} title="Reset zoom" className="text-xs text-gray-500 hover:text-gray-700 font-medium px-1 min-w-[38px] text-center">
            {Math.round(view.zoom * 100)}%
          </button>
          <button type="button" onClick={() => zoomBy(ZOOM_STEP)} title="Zoom in" className={iconBtnCls(false)}>➕</button>
          <span className="w-px h-4 bg-gray-200 mx-0.5" />
          <button type="button" onClick={undo} disabled={!canUndo} title="Undo" className={iconBtnCls(!canUndo)}>↩️</button>
          <button type="button" onClick={redo} disabled={!canRedo} title="Redo" className={iconBtnCls(!canRedo)}>↪️</button>
          <button type="button" onClick={() => fileInputRef.current?.click()} title="Insert image" className={iconBtnCls(false)}>🖼️</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
          <button type="button" onClick={clear} className="text-xs text-gray-400 hover:text-red-500 font-medium ml-1">Clear</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full block touch-none"
        style={{ aspectRatio: `${width} / ${height}`, cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
        onMouseDown={onMouseDown}
      />
    </div>
  )
})

export default ScratchBoard
