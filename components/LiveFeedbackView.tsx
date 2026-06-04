'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  questionId: string
  studentId: string
  savedCanvasData: string | null
}

export default function LiveFeedbackView({ questionId, studentId, savedCanvasData }: Props) {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLive, setIsLive] = useState(false)
  const [hasData, setHasData] = useState(!!savedCanvasData)
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function drawImage(dataUrl: string) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = dataUrl
  }

  useEffect(() => {
    if (savedCanvasData) { setHasData(true); drawImage(savedCanvasData) }
  }, [savedCanvasData])

  useEffect(() => {
    const channel = supabase.channel(`board:${questionId}:${studentId}`)
    channel.on('broadcast', { event: 'annotate' }, ({ payload }) => {
      setIsLive(true)
      setHasData(true)
      drawImage(payload.canvas_data)
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current)
      liveTimerRef.current = setTimeout(() => setIsLive(false), 5000)
    })
    channel.subscribe()
    return () => {
      supabase.removeChannel(channel)
      if (liveTimerRef.current) clearTimeout(liveTimerRef.current)
    }
  }, [questionId, studentId])

  if (!hasData) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="text-amber-700 text-sm">Your teacher hasn&apos;t annotated this yet. Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-amber-800">✏️ Teacher&apos;s Annotations</h3>
        {isLive && (
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium animate-pulse">
            ● Teacher is writing now
          </span>
        )}
      </div>
      <canvas ref={canvasRef} width={800} height={500}
        className="w-full rounded-lg border border-amber-200 bg-white" />
    </div>
  )
}
