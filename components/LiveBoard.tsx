'use client'

import { useRef, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const COLORS = ['#1a1a1a', '#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#ec4899', '#ffffff']
const SIZES = [3, 6, 12, 22]
const W = 1200
const H = 800

interface Props {
  questionId: string
  studentId: string
  role: 'student' | 'teacher'
  initialStudentData: string | null
  initialTeacherData: string | null
  onSaveStudent?: (dataUrl: string) => Promise<void>
  onSaveTeacher?: (dataUrl: string) => Promise<void>
}

export default function LiveBoard({
  questionId, studentId, role,
  initialStudentData, initialTeacherData,
  onSaveStudent, onSaveTeacher,
}: Props) {
  const supabase = createClient()
  const studentRef = useRef<HTMLCanvasElement>(null) // student's layer
  const teacherRef = useRef<HTMLCanvasElement>(null) // teacher's annotation layer
  const containerRef = useRef<HTMLDivElement>(null)
  const [color, setColor] = useState('#1a1a1a')
  const [size, setSize] = useState(6)
  const [isEraser, setIsEraser] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [liveIndicator, setLiveIndicator] = useState(false)
  const lastPt = useRef<{ x: number; y: number } | null>(null)
  const history = useRef<string[]>([])
  const redo = useRef<string[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const broadcastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const myCanvas = role === 'student' ? studentRef : teacherRef
  const theirCanvas = role === 'student' ? teacherRef : studentRef
  const myEvent = role === 'student' ? 'student_draw' : 'teacher_draw'
  const theirEvent = role === 'student' ? 'teacher_draw' : 'student_draw'

  useEffect(() => {
    // Init student canvas (white bg)
    const sc = studentRef.current
    if (sc) {
      const ctx = sc.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)
      if (initialStudentData) {
        const img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0)
        img.src = initialStudentData
      }
    }
    // Init teacher canvas (transparent)
    const tc = teacherRef.current
    if (tc) {
      const ctx = tc.getContext('2d')!
      ctx.clearRect(0, 0, W, H)
      if (initialTeacherData) {
        const img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0)
        img.src = initialTeacherData
      }
    }

    // Realtime channel
    const ch = supabase.channel(`board:${questionId}:${studentId}`)
    ch.on('broadcast', { event: theirEvent }, ({ payload }) => {
      const canvas = theirCanvas.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      img.onload = () => {
        if (role === 'student') {
          // incoming = teacher annotation layer (transparent)
          ctx.clearRect(0, 0, W, H)
        } else {
          // incoming = student layer (white bg)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, W, H)
        }
        ctx.drawImage(img, 0, 0, W, H)
        setLiveIndicator(true)
        if (liveTimer.current) clearTimeout(liveTimer.current)
        liveTimer.current = setTimeout(() => setLiveIndicator(false), 3000)
      }
      img.src = payload.canvas_data
    })
    ch.subscribe()
    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [questionId, studentId])

  function broadcast() {
    const canvas = myCanvas.current
    if (!canvas || !channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: myEvent,
      payload: { canvas_data: canvas.toDataURL('image/jpeg', 0.8) },
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

  function saveHist() {
    const c = myCanvas.current
    if (!c) return
    history.current.push(c.toDataURL())
    redo.current = []
    if (history.current.length > 25) history.current.shift()
  }

  function doUndo() {
    if (!history.current.length) return
    const c = myCanvas.current!
    const ctx = c.getContext('2d')!
    redo.current.push(c.toDataURL())
    const prev = history.current.pop()!
    const img = new Image()
    img.onload = () => {
      if (role === 'student') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H) }
      else ctx.clearRect(0, 0, W, H)
      ctx.drawImage(img, 0, 0)
      setTimeout(broadcast, 40)
    }
    img.src = prev
  }

  function doRedo() {
    if (!redo.current.length) return
    const c = myCanvas.current!
    const ctx = c.getContext('2d')!
    history.current.push(c.toDataURL())
    const next = redo.current.pop()!
    const img = new Image()
    img.onload = () => {
      if (role === 'student') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H) }
      else ctx.clearRect(0, 0, W, H)
      ctx.drawImage(img, 0, 0)
      setTimeout(broadcast, 40)
    }
    img.src = next
  }

  function addPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    // Photos always go on student layer
    const canvas = studentRef.current!
    const ctx = canvas.getContext('2d')!
    let yOffset = 30
    files.forEach(file => {
      saveHist()
      const reader = new FileReader()
      reader.onload = ev => {
        const img = new Image()
        img.onload = () => {
          const maxW = W * 0.55
          const maxH = H * 0.55
          const scale = Math.min(maxW / img.width, maxH / img.height, 1)
          const w = img.width * scale
          const h = img.height * scale
          const x = (W - w) / 2
          ctx.drawImage(img, x, yOffset, w, h)
          yOffset += h + 20
          // Broadcast student layer
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'student_draw',
              payload: { canvas_data: canvas.toDataURL('image/jpeg', 0.8) },
            })
          }
        }
        img.src = ev.target?.result as string
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function onMouseDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    saveHist()
    setIsDrawing(true)
    const pos = getPos(e)
    lastPt.current = pos
    const ctx = myCanvas.current!.getContext('2d')!
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, (isEraser ? size * 2 : size) / 2, 0, Math.PI * 2)
    ctx.fillStyle = isEraser ? 'rgba(0,0,0,1)' : color
    ctx.fill()
  }

  function onMouseMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = myCanvas.current!.getContext('2d')!
    const pos = getPos(e)
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.moveTo(lastPt.current!.x, lastPt.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = isEraser ? 'rgba(0,0,0,1)' : color
    ctx.lineWidth = isEraser ? size * 2 : size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPt.current = pos
    if (broadcastTimer.current) clearTimeout(broadcastTimer.current)
    broadcastTimer.current = setTimeout(broadcast, 40)
  }

  function onMouseUp() {
    if (!isDrawing) return
    setIsDrawing(false)
    lastPt.current = null
    broadcast()
  }

  function clearMyLayer() {
    saveHist()
    const c = myCanvas.current!
    const ctx = c.getContext('2d')!
    if (role === 'student') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H) }
    else ctx.clearRect(0, 0, W, H)
    broadcast()
  }

  async function save() {
    setSaving(true)
    if (role === 'student' && onSaveStudent) {
      await onSaveStudent(studentRef.current!.toDataURL())
    }
    if (role === 'teacher' && onSaveTeacher) {
      await onSaveTeacher(teacherRef.current!.toDataURL())
    }
    setSaving(false)
  }

  const canEditStudent = role === 'student'
  const liveLabel = role === 'student' ? '● Teacher is annotating' : '● Student is drawing'

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap bg-white rounded-xl border border-gray-200 px-3 py-2 flex-shrink-0">
        <div className="flex gap-1 items-center">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setIsEraser(false) }}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex-shrink-0 ${color === c && !isEraser ? 'border-purple-500 scale-125' : 'border-gray-300'}`}
              style={{ backgroundColor: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #d1d5db' : undefined }} />
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex gap-1 items-center">
          {SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)}
              className={`rounded-full bg-gray-800 flex-shrink-0 ${size === s ? 'ring-2 ring-purple-500' : ''}`}
              style={{ width: s + 12, height: s + 12 }} />
          ))}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <button onClick={() => setIsEraser(!isEraser)}
          className={`px-2 py-1 rounded-lg text-xs font-medium ${isEraser ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
          ◻ Erase
        </button>
        <button onClick={doUndo} className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600 hover:bg-gray-200">↩ Undo</button>
        <button onClick={doRedo} className="px-2 py-1 rounded-lg text-xs bg-gray-100 text-gray-600 hover:bg-gray-200">↪ Redo</button>
        {canEditStudent && (
          <label className="px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100 font-medium">
            📷 Add Photo
            <input type="file" accept="image/*" multiple onChange={addPhoto} className="hidden" />
          </label>
        )}
        <button onClick={clearMyLayer} className="px-2 py-1 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100">🗑 Clear</button>
        {liveIndicator && (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium animate-pulse ml-1">
            {liveLabel}
          </span>
        )}
        <button onClick={save} disabled={saving}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50">
          {saving ? 'Saving...' : '💾 Save Board'}
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 relative rounded-xl overflow-hidden border-2 border-gray-200 bg-white"
        style={{ minHeight: 500, cursor: isEraser ? 'cell' : 'crosshair', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onMouseDown}
        onTouchMove={onMouseMove}
        onTouchEnd={onMouseUp}
      >
        {/* Student layer (white background) */}
        <canvas ref={studentRef} width={W} height={H}
          className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
        {/* Teacher annotation layer (transparent overlay) */}
        <canvas ref={teacherRef} width={W} height={H}
          className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
      </div>

      <p className="text-xs text-gray-400 text-center">
        {role === 'student'
          ? 'Draw your work, add photos — your teacher sees it live and can annotate in red'
          : 'Draw annotations on the student\'s board — they see it live'}
      </p>
    </div>
  )
}
