'use client'

import { useRef, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const COLORS = ['#1a1a1a', '#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#ec4899', '#ffff00']
const SIZES = [2, 4, 8, 14]
const W = 1400
const H = 900

type Tool = 'pen' | 'highlight' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'select'

interface DrawableObject {
  id: string
  type: 'image'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  data: string
  src?: string // for temporary reference
}

interface Props {
  questionId: string
  studentId: string
  role: 'student' | 'teacher'
  initialStudentData: string | null
  initialTeacherData: string | null
  onSaveStudent?: (dataUrl: string) => Promise<void>
  onSaveTeacher?: (dataUrl: string) => Promise<void>
}

export default function AdvancedWhiteboard({
  questionId, studentId, role,
  initialStudentData, initialTeacherData,
  onSaveStudent, onSaveTeacher,
}: Props) {
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Drawing state
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#1a1a1a')
  const [size, setSize] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)

  // Interactive objects
  const [objects, setObjects] = useState<DrawableObject[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [resizingCorner, setResizingCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | 'mr' | 'ml' | 'tm' | 'bm' | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const lastPt = useRef<{ x: number; y: number } | null>(null)
  const history = useRef<string[]>([])
  const redo = useRef<string[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const broadcastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = useState(false)

  const canEdit = role === 'student' || role === 'teacher'

  // Initialize canvas and realtime sync
  useEffect(() => {
    if (!canvasRef.current) return

    // Setup canvas
    const ctx = canvasRef.current.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    if (role === 'student' && initialStudentData) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = initialStudentData
    } else if (role === 'teacher' && initialTeacherData) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = initialTeacherData
    }

    // Realtime sync
    const ch = supabase.channel(`board:${questionId}:${studentId}`)
    ch.on('broadcast', { event: 'board_update' }, ({ payload }) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, W, H)
        ctx.drawImage(img, 0, 0)
      }
      img.src = payload.canvas_data
    })
    ch.subscribe()
    channelRef.current = ch

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      supabase.removeChannel(ch)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [questionId, studentId])

  // Render objects with handles
  useEffect(() => {
    if (!overlayRef.current) return
    overlayRef.current.innerHTML = ''

    objects.forEach(obj => {
      if (obj.type === 'image') {
        const imgContainer = document.createElement('div')
        imgContainer.style.position = 'absolute'
        imgContainer.style.left = `${(obj.x / W) * 100}%`
        imgContainer.style.top = `${(obj.y / H) * 100}%`
        imgContainer.style.width = `${(obj.width / W) * 100}%`
        imgContainer.style.height = `${(obj.height / H) * 100}%`
        imgContainer.style.transform = `rotate(${obj.rotation}deg)`
        imgContainer.style.cursor = tool === 'select' ? 'move' : 'default'
        imgContainer.style.border = obj.id === selectedId ? '2px solid #7c3aed' : 'none'
        imgContainer.style.borderRadius = '8px'
        imgContainer.style.overflow = 'hidden'
        imgContainer.style.boxShadow = obj.id === selectedId ? '0 0 20px rgba(124, 58, 237, 0.5)' : 'none'
        imgContainer.style.transition = 'box-shadow 0.2s'

        const img = document.createElement('img')
        img.src = obj.data
        img.style.width = '100%'
        img.style.height = '100%'
        img.style.objectFit = 'contain'
        img.style.userSelect = 'none'
        img.draggable = false
        imgContainer.appendChild(img)

        // Selection and drag handlers
        imgContainer.onmousedown = (e) => {
          if (tool !== 'select') return
          e.preventDefault()
          e.stopPropagation()
          // Select this image
          setSelectedId(obj.id)
          const rect = containerRef.current!.getBoundingClientRect()
          setDragStart({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          })
          setDraggingId(obj.id)
        }

        // Corner handles for resizing
        const corners: Array<'tl' | 'tr' | 'bl' | 'br'> = ['tl', 'tr', 'bl', 'br']
        corners.forEach(corner => {
          const handle = document.createElement('div')
          const posStyle: { [key: string]: string } = {
            position: 'absolute',
            width: '12px',
            height: '12px',
            backgroundColor: '#7c3aed',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: `${corner === 'tl' ? 'nwse' : corner === 'tr' ? 'nesw' : corner === 'bl' ? 'nesw' : 'nwse'}-resize`,
            zIndex: '10',
            display: obj.id === selectedId ? 'block' : 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }

          if (corner === 'tl') {
            posStyle.top = '-8px'
            posStyle.left = '-8px'
          } else if (corner === 'tr') {
            posStyle.top = '-8px'
            posStyle.right = '-8px'
          } else if (corner === 'bl') {
            posStyle.bottom = '-8px'
            posStyle.left = '-8px'
          } else {
            posStyle.bottom = '-8px'
            posStyle.right = '-8px'
          }

          Object.assign(handle.style, posStyle)

          handle.onmousedown = (e) => {
            e.preventDefault()
            e.stopPropagation()
            setSelectedId(obj.id)
            setResizingId(obj.id)
            setResizingCorner(corner)
            const rect = containerRef.current!.getBoundingClientRect()
            setDragStart({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            })
          }

          imgContainer.appendChild(handle)
        })

        if (overlayRef.current) {
          overlayRef.current.appendChild(imgContainer)
        }
      }
    })
  }, [objects, selectedId, tool])

  // Handle dragging and resizing
  useEffect(() => {
    if (!containerRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top

      if (!dragStart) return

      const deltaX = currentX - dragStart.x
      const deltaY = currentY - dragStart.y

      // Normalize to canvas coordinates
      const sx = W / rect.width
      const sy = H / rect.height
      const ndx = deltaX * sx
      const ndy = deltaY * sy

      setObjects(prev =>
        prev.map(obj => {
          if (draggingId === obj.id && !resizingId) {
            return {
              ...obj,
              x: Math.max(0, Math.min(W - obj.width, obj.x + ndx)),
              y: Math.max(0, Math.min(H - obj.height, obj.y + ndy)),
            }
          }

          if (resizingId === obj.id && resizingCorner) {
            let newX = obj.x,
              newY = obj.y,
              newW = obj.width,
              newH = obj.height

            if (resizingCorner === 'br') {
              newW = Math.max(50, obj.width + ndx)
              newH = Math.max(50, obj.height + ndy)
            } else if (resizingCorner === 'bl') {
              newX = Math.max(0, obj.x + ndx)
              newW = Math.max(50, obj.width - ndx)
              newH = Math.max(50, obj.height + ndy)
            } else if (resizingCorner === 'tr') {
              newY = Math.max(0, obj.y + ndy)
              newW = Math.max(50, obj.width + ndx)
              newH = Math.max(50, obj.height - ndy)
            } else if (resizingCorner === 'tl') {
              newX = Math.max(0, obj.x + ndx)
              newY = Math.max(0, obj.y + ndy)
              newW = Math.max(50, obj.width - ndx)
              newH = Math.max(50, obj.height - ndy)
            }

            return { ...obj, x: newX, y: newY, width: newW, height: newH }
          }

          return obj
        })
      )

      setDragStart({ x: currentX, y: currentY })
    }

    const handleMouseUp = () => {
      setDraggingId(null)
      setResizingId(null)
      setResizingCorner(null)
      setDragStart(null)
      broadcast()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingId, resizingId, resizingCorner, dragStart])

  function broadcast() {
    const canvas = canvasRef.current
    if (!canvas || !channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'board_update',
      payload: { canvas_data: canvas.toDataURL('image/jpeg', 0.85) },
    })
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const container = containerRef.current!
    const rect = container.getBoundingClientRect()
    const sx = W / rect.width
    const sy = H / rect.height
    const src = 'touches' in e ? e.touches[0] : e
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy }
  }

  function saveHistory() {
    const canvas = canvasRef.current
    if (!canvas) return
    history.current.push(canvas.toDataURL())
    redo.current = []
    if (history.current.length > 30) history.current.shift()
  }

  function undo() {
    if (!history.current.length) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    redo.current.push(canvas.toDataURL())
    const prev = history.current.pop()!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      ctx.drawImage(img, 0, 0)
      broadcast()
    }
    img.src = prev
  }

  function redo_() {
    if (!redo.current.length) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    history.current.push(canvas.toDataURL())
    const next = redo.current.pop()!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      ctx.drawImage(img, 0, 0)
      broadcast()
    }
    img.src = next
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    if (!canEdit) return
    
    // Handle select tool differently
    if (tool === 'select') {
      // Check if clicking on canvas (not an object)
      if (e.target === canvasRef.current) {
        setSelectedId(null)
      }
      return
    }
    
    e.preventDefault()
    saveHistory()
    setIsDrawing(true)
    const pos = getPos(e)
    lastPt.current = pos

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'

    if (tool === 'highlight') {
      ctx.globalAlpha = 0.4
      ctx.fillStyle = color
      ctx.lineWidth = size * 2.5  // Make highlights thicker
    } else if (tool === 'eraser') {
      ctx.fillStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.fillStyle = color
    }

    ctx.beginPath()
    ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2)
    ctx.fill()
    if (tool !== 'highlight') {
      ctx.globalAlpha = 1
    }
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || !canEdit) return
    e.preventDefault()

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'

    if (tool === 'pen' || tool === 'highlight' || tool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(lastPt.current!.x, lastPt.current!.y)
      ctx.lineTo(pos.x, pos.y)

      if (tool === 'highlight') {
        ctx.globalAlpha = 0.4
        ctx.strokeStyle = color
        ctx.lineWidth = size * 2.5  // Thicker for highlighter effect
      } else if (tool === 'eraser') {
        ctx.strokeStyle = 'rgba(0,0,0,1)'
        ctx.lineWidth = size * 2
      } else {
        ctx.globalAlpha = 1
        ctx.strokeStyle = color
        ctx.lineWidth = size
      }

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      
      // Reset alpha if it was highlight
      if (tool === 'highlight') {
        ctx.globalAlpha = 1
      }
    }

    lastPt.current = pos

    if (broadcastTimer.current) clearTimeout(broadcastTimer.current)
    broadcastTimer.current = setTimeout(broadcast, 50)
  }

  function stopDrawing() {
    if (!isDrawing) return
    setIsDrawing(false)
    lastPt.current = null
    broadcast()
  }

  function addImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    files.forEach((file, idx) => {
      saveHistory()
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new Image()
        img.onload = () => {
          const maxW = W * 0.5
          const maxH = H * 0.5
          const scale = Math.min(maxW / img.width, maxH / img.height, 1)
          const w = img.width * scale
          const h = img.height * scale
          const x = (W - w) / 2
          const y = 50 + idx * 30

          // Only add as interactive object (don't draw to canvas)
          const newObj: DrawableObject = {
            id: `img-${Date.now()}-${idx}`,
            type: 'image',
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            data: ev.target?.result as string,
          }
          setObjects(prev => [...prev, newObj])
        }
        img.src = ev.target?.result as string
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  function clearCanvas() {
    saveHistory()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    setObjects([])
    broadcast()
  }

  function deleteSelected() {
    if (!selectedId) return
    saveHistory()
    setObjects(prev => prev.filter(obj => obj.id !== selectedId))
    setSelectedId(null)
    broadcast()
  }

  function rotateSelected() {
    if (!selectedId) return
    saveHistory()
    setObjects(prev =>
      prev.map(obj =>
        obj.id === selectedId ? { ...obj, rotation: (obj.rotation + 15) % 360 } : obj
      )
    )
  }

  async function save() {
    setSaving(true)
    const canvas = canvasRef.current
    if (canvas) {
      // Create a composite canvas with drawings + images
      const composite = document.createElement('canvas')
      composite.width = W
      composite.height = H
      const ctx = composite.getContext('2d')!
      
      // Draw the canvas content (drawings)
      ctx.drawImage(canvas, 0, 0)
      
      // Draw all images on top
      for (const obj of objects) {
        if (obj.type === 'image') {
          const img = new Image()
          img.src = obj.data
          await new Promise(resolve => {
            img.onload = () => {
              ctx.save()
              ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2)
              ctx.rotate((obj.rotation * Math.PI) / 180)
              ctx.drawImage(img, -obj.width / 2, -obj.height / 2, obj.width, obj.height)
              ctx.restore()
              resolve(null)
            }
          })
        }
      }
      
      const dataUrl = composite.toDataURL('image/png')
      if (role === 'student' && onSaveStudent) {
        await onSaveStudent(dataUrl)
      } else if (role === 'teacher' && onSaveTeacher) {
        await onSaveTeacher(dataUrl)
      }
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full gap-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4">
      {/* Enhanced Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-md flex flex-wrap gap-3 items-center justify-start overflow-x-auto">
        {/* Tools */}
        <div className="flex gap-2">
          <button
            onClick={() => setTool('pen')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tool === 'pen'
                ? 'bg-purple-600 text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✏️ Pen
          </button>
          <button
            onClick={() => setTool('highlight')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tool === 'highlight'
                ? 'bg-yellow-400 text-gray-900 shadow-md scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔆 Highlight
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tool === 'eraser'
                ? 'bg-red-600 text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ◻ Erase
          </button>
          <button
            onClick={() => setTool('select')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tool === 'select'
                ? 'bg-indigo-600 text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✋ Select
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Colors */}
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                color === c ? 'border-purple-600 scale-125 shadow-md ring-2 ring-purple-300' : 'border-gray-300'
              }`}
              style={{
                backgroundColor: c,
                boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #d1d5db' : undefined,
              }}
              title={c}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Size */}
        <div className="flex gap-2 items-center">
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`rounded-full transition-all ${
                size === s ? 'ring-2 ring-purple-600 shadow-md scale-110' : 'hover:scale-105'
              }`}
              style={{
                width: s + 16,
                height: s + 16,
                backgroundColor: '#374151',
              }}
              title={`${s}px`}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <label className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100 transition-all whitespace-nowrap">
            📷 Add Image
            <input type="file" accept="image/*" multiple onChange={addImage} className="hidden" />
          </label>
          <button
            onClick={() => rotateSelected()}
            disabled={!selectedId}
            className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-all whitespace-nowrap"
          >
            🔄 Rotate
          </button>
          <button
            onClick={() => deleteSelected()}
            disabled={!selectedId}
            className="px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all whitespace-nowrap"
          >
            🗑 Delete
          </button>
          <button
            onClick={undo}
            className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all whitespace-nowrap"
          >
            ↩️ Undo
          </button>
          <button
            onClick={redo_}
            className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all whitespace-nowrap"
          >
            ↪️ Redo
          </button>
          <button
            onClick={clearCanvas}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all whitespace-nowrap"
          >
            🗑 Clear All
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all shadow-md whitespace-nowrap"
          >
            {saving ? '⏳ Saving...' : '💾 Save'}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
        style={{
          aspectRatio: `${W}/${H}`,
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 320px)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="absolute inset-0 w-full h-full"
          style={{
            touchAction: 'none',
            background: 'white',
            display: 'block',
            cursor: tool === 'select' ? 'pointer' : 'crosshair',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Objects overlay with handles */}
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{
            pointerEvents: tool === 'select' ? 'auto' : 'none',
          }}
        />
      </div>

      {/* Status bar */}
      <div className="text-xs text-gray-500 px-2">
        {tool === 'select' && selectedId ? '✓ Object selected - Drag to move, corners to resize' : 
         tool === 'select' ? 'Click on images to select them' :
         `Tool: ${tool.charAt(0).toUpperCase() + tool.slice(1)} | Color: ${color} | Size: ${size}px`}
      </div>
    </div>
  )
}
