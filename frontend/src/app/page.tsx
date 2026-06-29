'use client'

import { useEffect, useState } from 'react'
import ChatPanel from '@/components/ChatPanel'
import DocumentRenderer from '@/components/DocumentRenderer'
import { CatalogEntry, DocumentData } from '@/types/document'

export default function Home() {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [selected, setSelected] = useState<CatalogEntry | null>(null)
  const [docData, setDocData] = useState<DocumentData>({})

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(setCatalog)
  }, [])

  function selectDoc(entry: CatalogEntry) {
    setSelected(entry)
    setDocData({})
  }

  function goBack() {
    setSelected(null)
    setDocData({})
  }

  if (!selected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold" style={{ color: '#032147' }}>
              AI Legal Document Creator
            </h1>
            <p className="text-sm mt-1" style={{ color: '#888888' }}>
              Select a document type to get started
            </p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          {catalog.length === 0 ? (
            <p className="text-gray-400 italic">Loading documents…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => selectDoc(entry)}
                  className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <h2
                    className="font-semibold text-sm mb-2"
                    style={{ color: '#032147' }}
                  >
                    {entry.name}
                  </h2>
                  <p className="text-xs leading-relaxed" style={{ color: '#888888' }}>
                    {entry.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="no-print flex-none bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold" style={{ color: '#032147' }}>
              {selected.name}
            </h1>
          </div>
          <button
            onClick={() => window.print()}
            className="text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: '#209dd7' }}
          >
            Download PDF
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full flex print:block print:overflow-visible">
        <div className="no-print w-5/12 flex flex-col border-r border-gray-200 bg-gray-50">
          <ChatPanel
            key={selected.id}
            data={docData}
            documentType={selected.id}
            onChange={setDocData}
          />
        </div>

        <div className="w-7/12 overflow-y-auto print:w-full">
          <DocumentRenderer filename={selected.filename} data={docData} />
        </div>
      </div>
    </div>
  )
}
