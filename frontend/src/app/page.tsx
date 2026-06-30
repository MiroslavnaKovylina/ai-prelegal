'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatPanel from '@/components/ChatPanel'
import DocumentRenderer from '@/components/DocumentRenderer'
import { CatalogEntry, DocumentData } from '@/types/document'
import { authHeaders, clearSession, getEmail } from '@/lib/auth'

interface SavedDocument {
  id: number
  document_type: string
  catalog_name: string
  fields: DocumentData
  messages: { role: 'user' | 'assistant'; content: string }[]
  updated_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [history, setHistory] = useState<SavedDocument[]>([])
  const [selected, setSelected] = useState<CatalogEntry | null>(null)
  const [docData, setDocData] = useState<DocumentData>({})
  const [docId, setDocId] = useState<number | null>(null)
  const [initialMessages, setInitialMessages] = useState<{ role: 'user' | 'assistant'; content: string }[] | undefined>(undefined)

  useEffect(() => {
    const e = getEmail()
    if (!e) { router.push('/login/'); return }
    setEmail(e)
    fetch('/api/catalog').then(r => r.json()).then(setCatalog)
    loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadHistory() {
    const res = await fetch('/api/documents', { headers: authHeaders() })
    if (res.status === 401) { handleLogout(); return }
    if (res.ok) setHistory(await res.json())
  }

  function handleLogout() {
    clearSession()
    router.push('/login/')
  }

  function selectDoc(entry: CatalogEntry) {
    setSelected(entry)
    setDocData({})
    setDocId(null)
    setInitialMessages(undefined)
  }

  function openSaved(doc: SavedDocument) {
    const entry = catalog.find(e => e.id === doc.document_type)
    if (!entry) return
    setSelected(entry)
    setDocData(doc.fields)
    setDocId(doc.id)
    setInitialMessages(doc.messages)
  }

  function goBack() {
    setSelected(null)
    setDocData({})
    setDocId(null)
    setInitialMessages(undefined)
    loadHistory()
  }

  function handleDocumentCreated(id: number) {
    setDocId(id)
    loadHistory()
  }

  if (!email) return null

  if (selected) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <header className="no-print flex-none bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-xl font-semibold leading-tight" style={{ color: '#032147' }}>
                  {selected.name} Creator
                </h1>
                <p className="text-xs" style={{ color: '#888888' }}>
                  Create a professional {selected.name} with AI assistance.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:block">{email}</span>
              <button
                onClick={() => window.print()}
                className="text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#209dd7' }}
              >
                Download PDF
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full flex print:block print:overflow-visible">
          <div className="no-print w-5/12 flex flex-col border-r border-gray-200 bg-gray-50">
            <ChatPanel
              key={`${selected.id}-${docId ?? 'new'}`}
              data={docData}
              documentType={selected.id}
              catalogName={selected.name}
              documentId={docId}
              initialMessages={initialMessages}
              onChange={setDocData}
              onDocumentCreated={handleDocumentCreated}
            />
          </div>

          <div className="w-7/12 overflow-y-auto print:w-full">
            <DocumentRenderer filename={selected.filename} data={docData} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#032147' }}>PreLegal</h1>
            <p className="text-sm mt-0.5" style={{ color: '#888888' }}>
              Draft legal agreements in minutes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {history.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#032147' }}>
              My Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => openSaved(doc)}
                  className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-tight" style={{ color: '#032147' }}>
                      {doc.catalog_name}
                    </h3>
                    <span className="flex-none text-xs px-2 py-0.5 rounded-full bg-blue-50 font-medium" style={{ color: '#209dd7' }}>
                      {Object.values(doc.fields).filter(Boolean).length} fields
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#888888' }}>
                    Last edited {formatDate(doc.updated_at)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#032147' }}>
            Create New Document
          </h2>
          {catalog.length === 0 ? (
            <p className="text-gray-400 italic text-sm">Loading documents…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => selectDoc(entry)}
                  className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-sm mb-2" style={{ color: '#032147' }}>
                    {entry.name}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#888888' }}>
                    {entry.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
