'use client'

import { useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import DrawingCanvas, { DrawingCanvasHandle } from '@/components/DrawingCanvas'

export default function TeacherWhiteboardPage() {
  const supabase = createClient()
  const canvasRef = useRef<DrawingCanvasHandle>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const SESSION_CODE = 'live-whiteboard'

  const broadcastChange = useCallback((dataUrl: string) => {
    if (!channelRef.current) {
      channelRef.current = supabase.channel(`whiteboard:${SESSION_CODE}`)
      channelRef.current.subscribe()
    }
    channelRef.current.send({
      type: 'broadcast',
      event: 'draw',
      payload: { canvas_data: dataUrl },
    })
  }, [supabase])

  function clearBoard() {
    canvasRef.current?.clear()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">Live Whiteboard</h1>
          <p className="text-sm text-gray-500">Students see your drawing in real time. Share the student view link with them.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearBoard}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Clear Board
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-purple-200 p-2">
        <DrawingCanvas
          ref={canvasRef}
          height={550}
          onDataChange={broadcastChange}
        />
      </div>

      <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-purple-800">Students see your board at:</p>
        <p className="text-purple-700 font-mono text-sm mt-1">
          {typeof window !== 'undefined' ? `${window.location.origin}/student/whiteboard` : '/student/whiteboard'}
        </p>
      </div>
    </div>
  )
}
