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
  const channelRef = useRef(supabase.channel(`comments:${questionId}:${studentId}`))

  useEffect(() => {
    // Load existing comments
    supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(full_name, role)')
      .eq('question_id', questionId)
      .eq('student_id', studentId)
      .order('created_at')
      .then(({ data }) => setComments((data as unknown as Comment[]) ?? []))

    // Listen for new comments via Broadcast (bypasses RLS, instant delivery)
    const ch = channelRef.current
    ch.on('broadcast', { event: 'new-comment' }, ({ payload }) => {
      setComments(prev => [...prev, payload as Comment])
    }).subscribe()

    return () => { supabase.removeChannel(ch) }
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
      await channelRef.current.send({
        type: 'broadcast',
        event: 'new-comment',
        payload: final,
      })
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
