'use client'

import { useEffect, useRef, useState } from 'react'
import { NDAFormData } from '@/types/nda'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  data: NDAFormData
  onChange: (data: NDAFormData) => void
}

function merge(current: NDAFormData, patch: Record<string, unknown>): NDAFormData {
  const next = { ...current }
  for (const [k, v] of Object.entries(patch)) {
    if (v == null) continue
    if (k === 'party1' || k === 'party2') {
      const updates = v as Record<string, unknown>
      next[k] = {
        ...current[k],
        ...Object.fromEntries(Object.entries(updates).filter(([, val]) => val != null)),
      }
    } else {
      (next as Record<string, unknown>)[k] = v
    }
  }
  return next
}

export default function ChatPanel({ data, onChange }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const dataRef = useRef(data)

  useEffect(() => { dataRef.current = data }, [data])

  useEffect(() => {
    post([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function post(msgs: Message[]) {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      })
      const { message, fields } = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: message }])
      onChange(merge(dataRef.current, fields))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    await post(next)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm leading-relaxed ${
                msg.role === 'user' ? 'text-white' : 'bg-white border border-gray-200 text-gray-800'
              }`}
              style={msg.role === 'user' ? { backgroundColor: '#209dd7' } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-400 italic">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-none border-t border-gray-200 p-3 flex gap-2 bg-gray-50"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={loading}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#753991' }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
