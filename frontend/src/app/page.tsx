'use client'

import { useState } from 'react'
import NDAForm from '@/components/NDAForm'
import NDADocument from '@/components/NDADocument'
import { NDAFormData, defaultFormData } from '@/types/nda'

export default function Home() {
  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [formData, setFormData] = useState<NDAFormData>(defaultFormData)

  function handleSubmit(data: NDAFormData) {
    setFormData(data)
    setStep('preview')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {step === 'form' ? (
        <NDAForm initialData={formData} onSubmit={handleSubmit} />
      ) : (
        <>
          <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setStep('form')}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Form
            </button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors"
            >
              Download PDF
            </button>
          </div>
          <NDADocument data={formData} />
        </>
      )}
    </main>
  )
}
