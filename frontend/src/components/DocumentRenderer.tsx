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

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function normalizeKey(k: string) {
  return k.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function substituteFields(template: string, data: DocumentData): string {
  // Build map: normalised name → exact span text content from the template
  const spanIndex = new Map<string, string>()
  const scanRe = /<span class="[^"]*_link">([^<]+)<\/span>/g
  let m
  while ((m = scanRe.exec(template)) !== null) {
    spanIndex.set(normalizeKey(m[1]), m[1])
  }

  let result = template
  for (const [key, value] of Object.entries(data)) {
    if (!value) continue
    // Resolve the exact span text by normalised lookup, fall back to key itself
    const spanName = spanIndex.get(normalizeKey(key)) ?? key
    const re = new RegExp(`<span class="[^"]*_link">${escapeRegex(spanName)}</span>`, 'gi')
    result = result.replace(re, `<strong>${escapeHtml(value)}</strong>`)
  }

  // Highlight still-unfilled placeholders
  result = result.replace(
    /<span class="[^"]*_link">([^<]+)<\/span>/g,
    '<mark>$1</mark>'
  )
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: Record<string, React.ComponentType<any>> = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mb-6 pb-3 border-b border-gray-200" style={{ color: '#032147' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold mt-8 mb-3" style={{ color: '#032147' }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mt-5 mb-2 text-gray-700">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-gray-700 mb-4 leading-relaxed">{children}</p>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-4 text-sm text-gray-700">{children}</ol>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 space-y-2 text-sm text-gray-700">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-600">{children}</em>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-gray-200">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 align-top">
      {children}
    </td>
  ),
  hr: () => <hr className="border-gray-200 my-8" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-500 text-sm">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded font-mono">
      {children}
    </code>
  ),
  // Span handles header_2 / header_3 styling from templates like BAA, Design Partner
  span: ({ className, children, style }) => {
    if (className === 'header_2') {
      return <span className="font-bold text-base" style={{ color: '#032147' }}>{children}</span>
    }
    if (className === 'header_3') {
      return <span className="font-semibold text-gray-800">{children}</span>
    }
    return <span className={className} style={style}>{children}</span>
  },
  // mark highlights unfilled field placeholders
  mark: ({ children, style }) => (
    <mark className="bg-yellow-100 text-yellow-800 px-1 rounded text-sm font-medium" style={style}>
      {children}
    </mark>
  ),
  // label appears in the NDA cover page template
  label: ({ children }) => (
    <label className="text-xs text-gray-500 italic block mb-1">{children}</label>
  ),
  // Checkboxes in the NDA cover page task lists
  input: ({ type, checked }: { type?: string; checked?: boolean }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          defaultChecked={checked}
          readOnly
          className="mr-2 align-middle accent-blue-600"
        />
      )
    }
    return <input type={type} />
  },
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

  if (error) return <div className="p-8 text-red-500 text-sm">Failed to load document template.</div>
  if (!template) return <div className="p-8 text-gray-400 italic text-sm">Loading document…</div>

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {substituteFields(template, data)}
      </ReactMarkdown>
    </div>
  )
}
