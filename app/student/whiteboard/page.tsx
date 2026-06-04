'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StudentWhiteboardPage() {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const channel = supabase.channel('whiteboard:live-whiteboard')

    channel.on('broadcast', { event: 'draw' }, ({ payload }) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = payload.canvas_data
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') setConnected(true)
    })

    // Initialise with white canvas
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-purple-900">Live Teacher Whiteboard</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {connected ? '● Live' : '○ Connecting...'}
        </span>
      </div>

      <div className="bg-white rounded-xl border-2 border-purple-200 p-2">
        <canvas
          ref={canvasRef}
          width={800}
          height={550}
          className="w-full rounded-lg"
        />
      </div>

      <p className="text-center text-sm text-gray-500 mt-3">Your teacher&apos;s drawing appears here in real time</p>
    </div>
  )
}
