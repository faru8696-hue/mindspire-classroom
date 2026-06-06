'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  src: string
  alt?: string
  className?: string
}

export default function ZoomableImage({ src, alt = '', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  function openLightbox() { setScale(1); setPos({ x: 0, y: 0 }); setOpen(true) }
  function close() { setOpen(false) }

  function zoomBy(delta: number) {
    setScale(s => {
      const next = Math.min(6, Math.max(1, +(s + delta).toFixed(2)))
      if (next <= 1) setPos({ x: 0, y: 0 })
      return next
    })
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 0.25 : -0.25)
  }
  function onDown(e: React.MouseEvent) {
    if (scale <= 1) return
    dragRef.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
  }
  function onMove(e: React.MouseEvent) {
    if (!dragRef.current) return
    setPos({ x: dragRef.current.px + (e.clientX - dragRef.current.x), y: dragRef.current.py + (e.clientY - dragRef.current.y) })
  }
  function onUp() { dragRef.current = null }

  const btn = 'w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white text-lg font-bold flex items-center justify-center leading-none transition-colors'

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onClick={openLightbox} className={`${className} cursor-zoom-in`} />

      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
          onClick={close}
          onWheel={onWheel}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
            <button onClick={() => zoomBy(-0.5)} className={btn} title="Zoom out">−</button>
            <span className="text-white/80 text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => zoomBy(0.5)} className={btn} title="Zoom in">+</button>
            <button onClick={() => { setScale(1); setPos({ x: 0, y: 0 }) }} className="px-3 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white text-sm font-medium transition-colors" title="Reset">Reset</button>
            <button onClick={close} className={btn} title="Close (Esc)">✕</button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            onClick={e => e.stopPropagation()}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onDoubleClick={() => { if (scale > 1) { setScale(1); setPos({ x: 0, y: 0 }) } else setScale(2) }}
            style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, cursor: scale > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'zoom-in' }}
            className="max-w-[92vw] max-h-[92vh] object-contain select-none transition-transform duration-75"
          />

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            Scroll or use +/− to zoom · double-click to toggle · drag to pan · Esc to close
          </p>
        </div>
      )}
    </>
  )
}
