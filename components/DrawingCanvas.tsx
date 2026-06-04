'use client'

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'

interface Props {
  readOnly?: boolean
  initialData?: string | null
  backgroundImageUrl?: string | null
  height?: number
  onDataChange?: (data: string) => void
}

export interface DrawingCanvasHandle {
  getDataUrl: () => string
  clear: () => void
  loadData: (data: string) => void
}

const COLORS = ['#1a1a1a', '#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#ea580c', '#f59e0b']
const SIZES = [2, 4, 8, 14]
const W = 800

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { readOnly = false, initialData, backgroundImageUrl, height = 400, onDataChange },
  ref
) {
  const bgRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#1a1a1a')
  const [size, setSize] = useState(4)
  const [isEraser, setIsEraser] = useState(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const historyRef = useRef<string[]>([])
  const redoRef = useRef<string[]>([])

  function getMerged() {
    const tmp = document.createElement('canvas')
    tmp.width = W; tmp.height = height
    const ctx = tmp.getContext('2d')!
    if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0)
    if (overlayRef.current) ctx.drawImage(overlayRef.current, 0, 0)
    return tmp.toDataURL()
  }

  useImperativeHandle(ref, () => ({
    getDataUrl: () => getMerged(),
    clear: () => {
      const ov = overlayRef.current; if (!ov) return
      ov.getContext('2d')!.clearRect(0, 0, ov.width, ov.height)
      onDataChange?.(getMerged())
    },
    loadData: (data: string) => {
      const ov = overlayRef.current; if (!ov) return
      const ctx = ov.getContext('2d')!
      ctx.clearRect(0, 0, ov.width, ov.height)
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = data
    },
  }))

  // Load background
  useEffect(() => {
    const bg = bgRef.current; if (!bg) return
    const ctx = bg.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, bg.width, bg.height)
    if (backgroundImageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const scale = Math.min(bg.width / img.width, bg.height / img.height)
        const x = (bg.width - img.width * scale) / 2
        const y = (bg.height - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      }
      img.src = backgroundImageUrl
    } else if (initialData && readOnly) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = initialData
    }
  }, [backgroundImageUrl, initialData, readOnly])

  // Load initial drawing layer
  useEffect(() => {
    if (readOnly) return
    const ov = overlayRef.current; if (!ov) return
    const ctx = ov.getContext('2d')!
    ctx.clearRect(0, 0, ov.width, ov.height)
    if (initialData && !backgroundImageUrl) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = initialData
    }
  }, [initialData, backgroundImageUrl, readOnly])

  function saveHistory() {
    const ov = overlayRef.current; if (!ov) return
    historyRef.current.push(ov.toDataURL())
    redoRef.current = []
    if (historyRef.current.length > 40) historyRef.current.shift()
  }

  function undo() {
    if (!historyRef.current.length) return
    const ov = overlayRef.current; if (!ov) return
    const ctx = ov.getContext('2d')!
    redoRef.current.push(ov.toDataURL())
    const prev = historyRef.current.pop()!
    ctx.clearRect(0, 0, ov.width, ov.height)
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0)
    img.src = prev
  }

  function redo() {
    if (!redoRef.current.length) return
    const ov = overlayRef.current; if (!ov) return
    const ctx = ov.getContext('2d')!
    historyRef.current.push(ov.toDataURL())
    const next = redoRef.current.pop()!
    ctx.clearRect(0, 0, ov.width, ov.height)
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0)
    img.src = next
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = overlayRef.current!
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy }
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    if (readOnly) return
    e.preventDefault()
    saveHistory()
    setIsDrawing(true)
    const pos = getPos(e)
    lastPoint.current = pos
    const ctx = overlayRef.current!.getContext('2d')!
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, (isEraser ? size * 3 : size) / 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,1)'
    if (!isEraser) { ctx.fillStyle = color }
    ctx.fill()
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || readOnly) return
    e.preventDefault()
    const ctx = overlayRef.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.moveTo(lastPoint.current!.x, lastPoint.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : color
    ctx.lineWidth = isEraser ? size * 3 : size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPoint.current = pos
  }

  function stopDrawing() {
    if (!isDrawing) return
    setIsDrawing(false)
    lastPoint.current = null
    onDataChange?.(getMerged())
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {!readOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {COLORS.map(c => (
              <button key={c} onClick={() => { setColor(c); setIsEraser(false) }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && !isEraser ? 'border-purple-500 scale-125' : 'border-gray-300'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-1 items-center ml-1">
            {SIZES.map(s => (
              <button key={s} onClick={() => setSize(s)}
                className={`rounded-full bg-gray-700 transition-transform ${size === s ? 'ring-2 ring-purple-500 scale-110' : ''}`}
                style={{ width: s * 2.5 + 8, height: s * 2.5 + 8 }} />
            ))}
          </div>
          <button onClick={() => setIsEraser(!isEraser)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${isEraser ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
            ◻ Erase
          </button>
          <button onClick={undo} title="Undo (Ctrl+Z)"
            className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600 hover:bg-gray-200">↩ Undo</button>
          <button onClick={redo} title="Redo (Ctrl+Y)"
            className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600 hover:bg-gray-200">↪ Redo</button>
        </div>
      )}
      <div className="relative flex-1" style={{ height }}>
        <canvas ref={bgRef} width={W} height={height}
          className="absolute inset-0 w-full h-full rounded-lg border border-gray-200" />
        {!readOnly && (
          <canvas ref={overlayRef} width={W} height={height}
            className="absolute inset-0 w-full h-full rounded-lg cursor-crosshair"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
        )}
      </div>
    </div>
  )
})

export default DrawingCanvas
