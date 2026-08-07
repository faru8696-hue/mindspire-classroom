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
const ScratchBoard = forwardRef<ScratchBoardHandle, { initialDataUrl?: string | null; label?: string; penColor?: string; width?: number; height?: number }>(function ScratchBoard(
  { initialDataUrl, label = '✏️ Work it out here', penColor = '#111827', width = 640, height = 320 }, ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())

  const objectsRef = useRef<BoardObject[]>([])
  const [objVersion, setObjVersion] = useState(0) // bumped to trigger a re-render/redraw after any object change
  const history = useRef<BoardObject[][]>([])
  const redoStack = useRef<BoardObject[][]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const syncUndoRedo = () => { setCanUndo(history.current.length > 0); setCanRedo(redoStack.current.length > 0) }

  const viewRef = useRef<ViewState>({ panX: 0, panY: 0, zoom: 1 })
  const [view, setViewState] = useState<ViewState>({ panX: 0, panY: 0, zoom: 1 })
  const setView = (v: ViewState) => { viewRef.current = v; setViewState(v) }

  const [tool, _setTool] = useState<Tool>('pen')
  const toolRef = useRef<Tool>('pen')
  function setTool(t: Tool) { toolRef.current = t; _setTool(t) }

  const drawing = useRef(false)
  const currentPath = useRef<{ x: number; y: number }[]>([])
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  // No copying needed: every mutation site below REASSIGNS objectsRef.current
  // to a brand-new array (spread or []) rather than mutating the existing
  // one in place, so the reference captured here stays valid forever — same
  // assumption undo()/redo() already rely on. Deep-cloning every stroke's
  // points array here used to cost O(total points across the whole board)
  // on every single new stroke (called from start(), the hottest path of
  // all), which on iPad was slow enough to visibly stall the start of the
  // next stroke as a test's scratch work accumulated content.
  const pushHistory = useCallback(() => {
    history.current.push(objectsRef.current)
    if (history.current.length > 50) history.current.shift()
    redoStack.current = []
    syncUndoRedo()
  }, [])

  // ── Render ──────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
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

    // The in-progress stroke isn't committed to objectsRef until pointerup,
    // so it's drawn separately here to stay visible while actively drawing.
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
  }, [penColor])

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
        setObjVersion(v => v + 1)
        redraw()
      }
      img.src = initialDataUrl
    } else {
      setObjVersion(v => v + 1)
      redraw()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDataUrl])

  useEffect(() => { redraw() }, [redraw, view, objVersion])

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

  // ── Pointer coordinates: screen → canvas-pixel → world (accounts for
  // both the w-full CSS stretch and the current pan/zoom). ──
  function toWorld(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY
    const v = viewRef.current
    return { x: (px - v.panX) / v.zoom, y: (py - v.panY) / v.zoom, px, py }
  }

  // Paints just the one new segment on top of whatever's already rendered —
  // O(1) regardless of how much the board already holds. move() used to call
  // the full redraw() (clear + repaint every object) on every single
  // pointermove, which is O(total board complexity) per event; as a test's
  // scratch work accumulated strokes over the session, that stopped keeping
  // up with iPad's touch event rate and drawing visibly stuttered. Safe to
  // paint additively here because nothing else repaints the canvas from
  // scratch between one full redraw() and the next (view/objects don't
  // change mid-stroke — panning and drawing are mutually exclusive tools).
  function drawSegment(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const v = viewRef.current
    const t = toolRef.current === 'pan' ? 'pen' : toolRef.current
    ctx.save()
    ctx.translate(v.panX, v.panY)
    ctx.scale(v.zoom, v.zoom)
    if (t === 'highlighter') { ctx.globalAlpha = 0.4; ctx.globalCompositeOperation = 'multiply' }
    else { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over' }
    ctx.strokeStyle = t === 'eraser' ? '#ffffff' : t === 'highlighter' ? '#fde047' : penColor
    ctx.lineWidth = t === 'eraser' ? 22 : t === 'highlighter' ? 14 : 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
    ctx.restore()
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    // Without pointer capture, a stroke silently cuts off the instant the
    // cursor drifts even 1px outside the canvas mid-drag (onPointerLeave
    // fires and, worse, further pointermove/pointerup events stop reaching
    // this element entirely until the pointer re-enters) — exactly what
    // "can't continuously write" looks like when writing near an edge.
    // Capturing routes every event for this pointer here regardless of
    // where it physically is until pointerup, so a drag never gets cut off.
    e.currentTarget.setPointerCapture(e.pointerId)
    if (toolRef.current === 'pan') {
      const p = toWorld(e)
      panStart.current = { x: p.px, y: p.py, panX: viewRef.current.panX, panY: viewRef.current.panY }
      return
    }
    // pushHistory() is deferred to end() (once the stroke is confirmed real,
    // see below) rather than called here — this used to run on every single
    // pointerdown, including the two setState calls inside it, right at the
    // start of the most latency-sensitive moment of a touch gesture.
    drawing.current = true
    const p = toWorld(e)
    currentPath.current = [{ x: p.x, y: p.y }]
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (panStart.current) {
      const p = toWorld(e)
      setView({ ...viewRef.current, panX: panStart.current.panX + (p.px - panStart.current.x), panY: panStart.current.panY + (p.py - panStart.current.y) })
      return
    }
    if (!drawing.current) return
    const p = toWorld(e)
    const last = currentPath.current[currentPath.current.length - 1]
    currentPath.current = [...currentPath.current, { x: p.x, y: p.y }]
    if (last) drawSegment(last, p)
  }

  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if (panStart.current) { panStart.current = null; return }
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
      setObjVersion(v => v + 1)
    }
    drawing.current = false
    currentPath.current = []
  }

  function clear() {
    if (objectsRef.current.length === 0) return
    pushHistory()
    objectsRef.current = []
    setObjVersion(v => v + 1)
  }

  function undo() {
    if (!history.current.length) return
    redoStack.current.push(objectsRef.current)
    objectsRef.current = history.current.pop()!
    setObjVersion(v => v + 1)
    syncUndoRedo()
  }

  function redo() {
    if (!redoStack.current.length) return
    history.current.push(objectsRef.current)
    objectsRef.current = redoStack.current.pop()!
    setObjVersion(v => v + 1)
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
      const scaleX = canvas!.width / rect.width, scaleY = canvas!.height / rect.height
      const px = (e.clientX - rect.left) * scaleX, py = (e.clientY - rect.top) * scaleY
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
      const maxW = width * 0.7, maxH = height * 0.7
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale
      const v = viewRef.current
      const canvas = canvasRef.current
      const cx = ((canvas?.width ?? width) / 2 - v.panX) / v.zoom
      const cy = ((canvas?.height ?? height) / 2 - v.panY) / v.zoom
      pushHistory()
      objectsRef.current = [...objectsRef.current, { kind: 'image', x: cx - w / 2, y: cy - h / 2, width: w, height: h, src: dataUrl }]
      setObjVersion(v2 => v2 + 1)
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
        width={width}
        height={height}
        className="w-full h-auto touch-none"
        style={{ cursor: tool === 'pan' ? 'grab' : 'crosshair' }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  )
})

export default ScratchBoard
