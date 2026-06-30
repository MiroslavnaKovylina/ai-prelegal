'use client'

import { useEffect, useRef, useState } from 'react'
import { DocumentData } from '@/types/document'
import { authHeaders } from '@/lib/auth'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  data: DocumentData
  documentType: string
  catalogName: string
  documentId: number | null
  initialMessages?: Message[]
  onChange: (data: DocumentData) => void
  onDocumentCreated: (id: number) => void
}

function merge(current: DocumentData, patch: Record<string, unknown>): DocumentData {
  const next = { ...current }
  for (const [k, v] of Object.entries(patch)) {
    if (v == null) continue
    if (typeof v === 'object' && !Array.isArray(v)) {
      const sub = v as Record<string, unknown>
      const existing = (current[k] as Record<string, unknown> | undefined) ?? {}
      next[k] = {
        ...existing,
        ...Object.fromEntries(Object.entries(sub).filter(([, val]) => val != null)),
      } as unknown as string
    } else {
      next[k] = String(v)
    }
  }
  return next
}

export default function ChatPanel({
  data, documentType, catalogName, documentId,
  initialMessages, onChange, onDocumentCreated,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dataRef = useRef(data)
  const docIdRef = useRef(documentId)

  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => { docIdRef.current = documentId }, [documentId])

  useEffect(() => {
    if (!initialMessages || initialMessages.length === 0) {
      post([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function saveDocument(msgs: Message[], fields: DocumentData) {
    if (docIdRef.current === null) {
      // Create new document
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ document_type: documentType, catalog_name: catalogName, fields, messages: msgs }),
      })
      if (res.ok) {
        const doc = await res.json()
        docIdRef.current = doc.id
        onDocumentCreated(doc.id)
      }
    } else {
      await fetch(`/api/documents/${docIdRef.current}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ fields, messages: msgs }),
      })
    }
  }

  async function post(msgs: Message[]) {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ messages: msgs, document_type: documentType }),
      })
      const { message, fields } = await res.json()
      const updatedMsgs = [...msgs, { role: 'assistant' as const, content: message }]
      setMessages(updatedMsgs)
      const updatedData = merge(dataRef.current, fields)
      onChange(updatedData)
      await saveDocument(updatedMsgs, updatedData)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
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
          ref={inputRef}
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
