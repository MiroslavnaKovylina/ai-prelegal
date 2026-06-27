'use client'

import { useState } from 'react'
import { NDAFormData, PartyInfo, defaultFormData } from '@/types/nda'

interface Props {
  initialData: NDAFormData
  onSubmit: (data: NDAFormData) => void
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function PartyFields({
  label,
  value,
  onChange,
}: {
  label: string
  value: PartyInfo
  onChange: (v: PartyInfo) => void
}) {
  function update(field: keyof PartyInfo, val: string) {
    onChange({ ...value, [field]: val })
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">{label}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Full Name" value={value.name} onChange={(v) => update('name', v)} placeholder="Jane Smith" />
        <TextField label="Title" value={value.title} onChange={(v) => update('title', v)} placeholder="CEO" />
        <TextField label="Company" value={value.company} onChange={(v) => update('company', v)} placeholder="Acme Corp" />
        <TextField
          label="Notice Address (email or postal)"
          value={value.address}
          onChange={(v) => update('address', v)}
          placeholder="jane@acme.com"
        />
      </div>
    </div>
  )
}

export default function NDAForm({ initialData, onSubmit }: Props) {
  const [data, setData] = useState<NDAFormData>(initialData)

  function update<K extends keyof NDAFormData>(key: K, value: NDAFormData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mutual NDA Creator</h1>
        <p className="mt-2 text-gray-500">
          Fill in the details below to generate a completed Mutual Non-Disclosure Agreement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Agreement Details */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Agreement Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose <span className="font-normal text-gray-400">— how confidential information may be used</span>
            </label>
            <textarea
              value={data.purpose}
              onChange={(e) => update('purpose', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <TextField
            label="Effective Date"
            value={data.effectiveDate}
            onChange={(v) => update('effectiveDate', v)}
            type="date"
          />
        </section>

        {/* Terms */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Terms</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MNDA Term <span className="font-normal text-gray-400">— the length of this agreement</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="mndaTermType"
                  checked={data.mndaTermType === 'years'}
                  onChange={() => update('mndaTermType', 'years')}
                />
                Expires
                <input
                  type="number"
                  min={1}
                  value={data.mndaTermYears}
                  onChange={(e) => update('mndaTermYears', Number(e.target.value))}
                  disabled={data.mndaTermType !== 'years'}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-40"
                />
                year(s) from Effective Date
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="mndaTermType"
                  checked={data.mndaTermType === 'until-terminated'}
                  onChange={() => update('mndaTermType', 'until-terminated')}
                />
                Continues until terminated
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term of Confidentiality <span className="font-normal text-gray-400">— how long information is protected</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="confidentialityTermType"
                  checked={data.confidentialityTermType === 'years'}
                  onChange={() => update('confidentialityTermType', 'years')}
                />
                <input
                  type="number"
                  min={1}
                  value={data.confidentialityTermYears}
                  onChange={(e) => update('confidentialityTermYears', Number(e.target.value))}
                  disabled={data.confidentialityTermType !== 'years'}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-40"
                />
                year(s) from Effective Date
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="confidentialityTermType"
                  checked={data.confidentialityTermType === 'perpetuity'}
                  onChange={() => update('confidentialityTermType', 'perpetuity')}
                />
                In perpetuity
              </label>
            </div>
          </div>
        </section>

        {/* Legal */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Governing Law & Jurisdiction</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Governing Law (State)"
              value={data.governingLaw}
              onChange={(v) => update('governingLaw', v)}
              placeholder="e.g., Delaware"
            />
            <TextField
              label="Jurisdiction"
              value={data.jurisdiction}
              onChange={(v) => update('jurisdiction', v)}
              placeholder="e.g., New Castle, DE"
            />
          </div>
        </section>

        {/* Parties */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Parties</h2>
          <PartyFields label="Party 1" value={data.party1} onChange={(v) => update('party1', v)} />
          <hr className="border-gray-100" />
          <PartyFields label="Party 2" value={data.party2} onChange={(v) => update('party2', v)} />
        </section>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-base transition-colors"
        >
          Generate NDA →
        </button>
      </form>
    </div>
  )
}
