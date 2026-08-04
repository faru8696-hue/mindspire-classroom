'use client'

import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react'

export interface ScratchBoardHandle {
  getSnapshot: () => string | null
}

type Tool = 'pen' | 'highlighter' | 'eraser'

// A deliberately simple freehand canvas for self-study FRQ questions — not
// the full InfiniteWhiteboard (which is tightly coupled to realtime channels
// and storage paths keyed by questionId+studentId for the REAL assigned-work
// board; reusing it here would collide with that same student's actual
// submission for this question). Pen/highlighter/eraser + clear, entirely
// local state, exported as a PNG data URL on demand via the ref.
const ScratchBoard = forwardRef<ScratchBoardHandle, { initialDataUrl?: string | null; label?: string; penColor?: string }>(function ScratchBoard(
  { initialDataUrl, label = '✏️ Work it out here', penColor = '#111827' }, ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [hasStrokes, setHasStrokes] = useState(false)
  // Ref mirrors the tool selection so the pointer-move handler (a plain
  // callback, not re-created per render) always reads the current tool
  // instead of whatever it was when the handler closure was captured.
  const [tool, _setTool] = useState<Tool>('pen')
  const toolRef = useRef<Tool>('pen')
  function setTool(t: Tool) { toolRef.current = t; _setTool(t) }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (initialDataUrl) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = initialDataUrl
      setHasStrokes(true)
    }
  }, [initialDataUrl])

  useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      if (!hasStrokes || !canvasRef.current) return null
      return canvasRef.current.toDataURL('image/png')
    },
  }), [hasStrokes])

  // The canvas has a fixed internal resolution (640x320) but is displayed
  // at whatever CSS width its container gives it (w-full) — without
  // rescaling by that ratio, drawing coordinates land wherever the pointer
  // is on SCREEN rather than the corresponding point in the canvas's own
  // pixel grid, which drifts further from the cursor the more the
  // displayed size differs from 640x320 (e.g. in a narrower half-column).
  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true
    last.current = pos(e)
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !last.current) return
    const p = pos(e)
    const t = toolRef.current
    if (t === 'eraser') {
      // The board's background is always opaque white (filled above and on
      // clear()), so painting white achieves a real visual erase without
      // needing canvas composite-mode tricks.
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 22
    } else if (t === 'highlighter') {
      // 'multiply' so it tints existing ink underneath instead of covering
      // it — a real highlighter effect over both blank space and pen marks.
      ctx.globalCompositeOperation = 'multiply'
      ctx.strokeStyle = '#fde047'
      ctx.lineWidth = 14
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = penColor
      ctx.lineWidth = 2.5
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    setHasStrokes(true)
  }

  function end() {
    drawing.current = false
    last.current = null
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
  }

  const toolBtnCls = (active: boolean) =>
    `text-sm px-2 py-1 rounded-md transition-colors ${active ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex-wrap gap-1.5">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setTool('pen')} title="Pen" className={toolBtnCls(tool === 'pen')}>✏️</button>
          <button type="button" onClick={() => setTool('highlighter')} title="Highlighter" className={toolBtnCls(tool === 'highlighter')}>🖍️</button>
          <button type="button" onClick={() => setTool('eraser')} title="Eraser" className={toolBtnCls(tool === 'eraser')}>🧹</button>
          <button type="button" onClick={clear} className="text-xs text-gray-400 hover:text-red-500 font-medium ml-1">Clear</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={320}
        className="w-full h-auto touch-none cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  )
})

export default ScratchBoard
