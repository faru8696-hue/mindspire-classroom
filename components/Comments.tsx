'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  message: string
  created_at: string
  author_id: string
  author: { full_name: string; role: string } | null
}

interface Props {
  questionId: string
  studentId: string
  currentUserId: string
  currentUserName: string
}

export default function Comments({ questionId, studentId, currentUserId, currentUserName }: Props) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Hold the CURRENT channel instances so sendMessage (defined outside the
  // effect) can always send on the live one. The channel OBJECTS themselves
  // must be created fresh inside the effect below, never reused across a
  // subscribe cycle — a Supabase RealtimeChannel can only be subscribed once
  // ever; calling .subscribe() again on the same instance (even after
  // unsubscribing) throws "tried to join multiple times". Previously these
  // were created once via the useRef initializer and reused every time the
  // question changed, which is exactly what threw that error when a student
  // clicked "Next question".
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const teacherAlertChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  function playPing() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = 740
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(); osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }

  useEffect(() => {
    // Load existing comments
    supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(full_name, role)')
      .eq('question_id', questionId)
      .eq('student_id', studentId)
      .order('created_at')
      .then(({ data }) => setComments((data as unknown as Comment[]) ?? []))

    // Listen for new comments via Broadcast — fresh channel instance every
    // time this effect runs (mount, or questionId/studentId change).
    const ch = supabase.channel(`comments:${questionId}:${studentId}`)
    ch.on('broadcast', { event: 'new-comment' }, ({ payload }) => {
      const incoming = payload as Comment
      if (incoming.author_id !== currentUserId) playPing()
      setComments(prev => [...prev, incoming])
    })
    ch.subscribe()
    channelRef.current = ch

    // Listen for grade-update on the dedicated grade-notif channel
    function playGradeTone(grade: string) {
      try {
        if (!audioRef.current) audioRef.current = new AudioContext()
        const ctx = audioRef.current
        const freqs = grade === 'correct' ? [523, 659, 784] : grade === 'partial' ? [523, 659] : [392, 330]
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4)
          osc.start(ctx.currentTime + i * 0.15)
          osc.stop(ctx.currentTime + i * 0.15 + 0.4)
        })
      } catch {}
    }
    const gradeNotifCh = supabase.channel(`grade-notif:${questionId}:${studentId}`)
    gradeNotifCh.on('broadcast', { event: 'grade-update' }, ({ payload }) => {
      const { grade } = payload as { grade: string }
      playGradeTone(grade)
    })
    gradeNotifCh.subscribe()

    // Subscribe teacher-alerts channel so we can broadcast to it when student
    // comments — also a fresh instance every run, for the same reason as `ch`.
    const teacherAlertCh = supabase.channel('teacher-alerts')
    teacherAlertCh.subscribe()
    teacherAlertChannelRef.current = teacherAlertCh

    return () => {
      supabase.removeChannel(ch)
      supabase.removeChannel(gradeNotifCh)
      supabase.removeChannel(teacherAlertCh)
    }
  }, [questionId, studentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    const now = new Date().toISOString()
    const newComment: Comment = {
      id: crypto.randomUUID(),
      message: message.trim(),
      created_at: now,
      author_id: currentUserId,
      author: { full_name: currentUserName, role: '' },
    }

    // Show immediately for sender
    setComments(prev => [...prev, newComment])
    setMessage('')

    // Save to DB
    const { data: inserted, error } = await supabase.from('comments').insert({
      question_id: questionId,
      student_id: studentId,
      author_id: currentUserId,
      message: newComment.message,
    }).select('id').single()

    if (error) {
      console.error('Comment send failed:', error)
      setComments(prev => prev.filter(c => c.id !== newComment.id))
    } else {
      // Broadcast to other party with real DB id
      const final = { ...newComment, id: inserted.id }
      await channelRef.current?.send({
        type: 'broadcast',
        event: 'new-comment',
        payload: final,
      })
      if (currentUserId !== studentId) {
        // Teacher commenting — notify the student persistently
        fetch('/api/notify-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, questionId, type: 'comment', feedback: newComment.message }),
        })
      } else {
        // Student commenting — broadcast DIRECTLY to teacher-alerts channel (instant)
        await teacherAlertChannelRef.current?.send({
          type: 'broadcast',
          event: 'student-alert',
          payload: {
            id: inserted.id,
            type: 'comment',
            student_id: studentId,
            question_id: questionId,
            class_id: '',
            created_at: now,
            read: false,
            student_name: currentUserName,
            question_title: newComment.message,
          },
        })
        // Also persist to DB for history
        fetch('/api/notify-teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, questionId, studentName: currentUserName, message: newComment.message }),
        })
      }
    }
    setSending(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ maxHeight: 320 }}>
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="font-semibold text-gray-700 text-sm">💬 Comments</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: 200 }}>
        {comments.length === 0 && (
          <p className="text-gray-400 text-sm text-center">No comments yet. Start the conversation!</p>
        )}
        {comments.map((c) => {
          const isMe = c.author_id === currentUserId
          const isTeacher = c.author?.role === 'teacher'
          return (
            <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-2xl px-3 py-2 ${isMe ? 'bg-purple-600 text-white' : isTeacher ? 'bg-amber-50 border border-amber-200 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                {!isMe && (
                  <p className={`text-xs font-semibold mb-0.5 ${isTeacher ? 'text-amber-700' : 'text-gray-500'}`}>
                    {isTeacher ? '👩‍🏫 ' : ''}{c.author?.full_name ?? 'Unknown'}
                  </p>
                )}
                <p className="text-sm">{c.message}</p>
                <p className={`text-xs mt-0.5 ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                  {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
