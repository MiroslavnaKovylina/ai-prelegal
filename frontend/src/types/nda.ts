export interface PartyInfo {
  name: string
  title: string
  company: string
  address: string
}

export interface NDAFormData {
  purpose: string
  effectiveDate: string
  mndaTermType: 'years' | 'until-terminated'
  mndaTermYears: number
  confidentialityTermType: 'years' | 'perpetuity'
  confidentialityTermYears: number
  governingLaw: string
  jurisdiction: string
  party1: PartyInfo
  party2: PartyInfo
}

export const defaultFormData: NDAFormData = {
  purpose: 'Evaluating whether to enter into a business relationship with the other party.',
  effectiveDate: new Date().toISOString().split('T')[0],
  mndaTermType: 'years',
  mndaTermYears: 1,
  confidentialityTermType: 'years',
  confidentialityTermYears: 1,
  governingLaw: '',
  jurisdiction: '',
  party1: { name: '', title: '', company: '', address: '' },
  party2: { name: '', title: '', company: '', address: '' },
}
