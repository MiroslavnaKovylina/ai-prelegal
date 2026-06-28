'use client'

import { useState } from 'react'
import NDAForm from '@/components/NDAForm'
import NDADocument from '@/components/NDADocument'
import { NDAFormData, defaultFormData } from '@/types/nda'

export default function Home() {
  const [formData, setFormData] = useState<NDAFormData>(defaultFormData)

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar — hidden when printing */}
      <header className="no-print flex-none bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <h1 className="text-xl font-semibold text-gray-900">Mutual NDA Creator</h1>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors"
          >
            Download PDF
          </button>
        </div>
      </header>

      {/* Split panels */}
      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full flex print:block print:overflow-visible">
        {/* Left: Form — hidden when printing */}
        <div className="no-print w-5/12 overflow-y-auto border-r border-gray-200 bg-gray-50">
          <NDAForm data={formData} onChange={setFormData} />
        </div>

        {/* Right: Live preview */}
        <div className="w-7/12 overflow-y-auto print:w-full">
          <NDADocument data={formData} />
        </div>
      </div>
    </div>
  )
}
