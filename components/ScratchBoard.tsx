'use client'

import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react'

export interface ScratchBoardHandle {
  getSnapshot: () => string | null
}

// A deliberately simple freehand canvas for self-study FRQ questions — not
// the full InfiniteWhiteboard (which is tightly coupled to realtime channels
// and storage paths keyed by questionId+studentId for the REAL assigned-work
// board; reusing it here would collide with that same student's actual
// submission for this question). This is pen + clear only, entirely local
// state, exported as a PNG data URL on demand via the ref.
const ScratchBoard = forwardRef<ScratchBoardHandle, { initialDataUrl?: string | null }>(function ScratchBoard(
  { initialDataUrl }, ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [hasStrokes, setHasStrokes] = useState(false)

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

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
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
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
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

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500">✏️ Work it out here</span>
        <button onClick={clear} className="text-xs text-gray-400 hover:text-red-500 font-medium">Clear</button>
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
