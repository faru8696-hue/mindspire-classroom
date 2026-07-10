'use client'

import { useEffect, useState } from 'react'

interface ChatMessage {
  role: 'user' | 'model'
  message: string
  created_at: string
}

// Read-only viewer for a student's AI Faridah chat transcript — teacher-only,
// backed by /api/ai-chat-history (RLS on ai_chat_messages only lets the
// student themselves read their own rows directly).
export default function AiChatHistory({ questionId, studentId }: { questionId: string; studentId: string }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/ai-chat-history?questionId=${questionId}&studentId=${studentId}`)
      .then(res => res.json())
      .then(data => { if (active) { if (data.error) setError(data.error); else setMessages(data.messages) } })
      .catch(() => { if (active) setError('Could not load chat history') })
    return () => { active = false }
  }, [questionId, studentId])

  if (error) return <p className="text-sm text-red-600 p-4">{error}</p>
  if (!messages) return <p className="text-sm text-gray-400 p-4">Loading…</p>
  if (messages.length === 0) return <p className="text-sm text-gray-400 p-4 text-center">This student hasn't asked AI Faridah anything yet.</p>

  return (
    <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 400 }}>
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
            m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
          }`}>
            {m.message}
          </div>
        </div>
      ))}
    </div>
  )
}
