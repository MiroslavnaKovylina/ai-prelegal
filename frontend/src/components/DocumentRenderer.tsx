'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { DocumentData } from '@/types/document'

interface Props {
  filename: string
  data: DocumentData
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function substituteFields(template: string, data: DocumentData): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    if (!value) continue
    const re = new RegExp(`<span class="[^"]*_link">${escapeRegex(key)}</span>`, 'g')
    result = result.replace(re, `<strong>${value}</strong>`)
  }
  // Highlight remaining unfilled span placeholders
  result = result.replace(
    /<span class="[^"]*_link">([^<]+)<\/span>/g,
    '<mark style="background:#fef9c3;padding:0 2px;border-radius:2px">$1</mark>'
  )
  return result
}

export default function DocumentRenderer({ filename, data }: Props) {
  const [template, setTemplate] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setTemplate(null)
    setError(false)
    const name = filename.split('/').pop()
    fetch(`/api/templates/${name}`)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.text()
      })
      .then(setTemplate)
      .catch(() => setError(true))
  }, [filename])

  if (error) return <div className="p-8 text-red-500">Failed to load document template.</div>
  if (!template) return <div className="p-8 text-gray-400 italic">Loading document…</div>

  const content = substituteFields(template, data)

  return (
    <div className="p-8 prose prose-sm max-w-none text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
