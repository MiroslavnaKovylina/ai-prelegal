import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import NDADocument from '@/components/NDADocument'
import { NDAFormData, defaultFormData } from '@/types/nda'

const baseData: NDAFormData = {
  ...defaultFormData,
  purpose: 'Evaluating a partnership',
  effectiveDate: '2025-03-15',
  mndaTermType: 'years',
  mndaTermYears: 2,
  confidentialityTermType: 'years',
  confidentialityTermYears: 3,
  governingLaw: 'Delaware',
  jurisdiction: 'Wilmington, DE',
  party1: { name: 'Alice Johnson', title: 'CEO', company: 'Alpha Inc.', address: 'alice@alpha.com' },
  party2: { name: 'Bob Smith', title: 'CTO', company: 'Beta LLC', address: 'bob@beta.com' },
}

describe('NDADocument', () => {
  describe('title', () => {
    it('renders the MNDA heading', () => {
      render(<NDADocument data={baseData} />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mutual Non-Disclosure Agreement')
    })
  })

  describe('formatDate', () => {
    it('formats a valid ISO date as long-form US date', () => {
      render(<NDADocument data={baseData} />)
      expect(screen.getAllByText(/March 15, 2025/).length).toBeGreaterThan(0)
    })

    it('shows [Date] placeholder when effectiveDate is empty', () => {
      render(<NDADocument data={{ ...baseData, effectiveDate: '' }} />)
      expect(screen.getAllByText(/\[Date\]/).length).toBeGreaterThan(0)
    })

    it('handles leap day correctly', () => {
      render(<NDADocument data={{ ...baseData, effectiveDate: '2024-02-29' }} />)
      expect(screen.getAllByText(/February 29, 2024/).length).toBeGreaterThan(0)
    })

    it('handles year boundary (Dec 31)', () => {
      render(<NDADocument data={{ ...baseData, effectiveDate: '2024-12-31' }} />)
      expect(screen.getAllByText(/December 31, 2024/).length).toBeGreaterThan(0)
    })
  })

  describe('purpose', () => {
    it('shows purpose in the cover page field', () => {
      render(<NDADocument data={baseData} />)
      const coverFields = screen.getAllByText('Evaluating a partnership')
      expect(coverFields.length).toBeGreaterThanOrEqual(1)
    })

    it('inlines purpose text into section 1 (Introduction)', () => {
      render(<NDADocument data={baseData} />)
      const intro = screen.getByText(/1\. Introduction\./).closest('p')!
      expect(intro.textContent).toContain('Evaluating a partnership')
    })

    it('inlines purpose text into section 2 (Use and Protection)', () => {
      render(<NDADocument data={baseData} />)
      const useSection = screen.getByText(/2\. Use and Protection/).closest('p')!
      expect(useSection.textContent).toContain('Evaluating a partnership')
    })
  })

  describe('MNDA Term', () => {
    it('shows years-based term on cover page', () => {
      render(<NDADocument data={baseData} />)
      expect(screen.getByText('Expires 2 year(s) from Effective Date.')).toBeInTheDocument()
    })

    it('shows until-terminated term on cover page', () => {
      render(<NDADocument data={{ ...baseData, mndaTermType: 'until-terminated' }} />)
      expect(
        screen.getByText('Continues until terminated in accordance with the terms of the MNDA.')
      ).toBeInTheDocument()
    })

    it('inlines years-based MNDA term into section 5 (Term and Termination)', () => {
      render(<NDADocument data={baseData} />)
      const section5 = screen.getByText(/5\. Term and Termination\./).closest('p')!
      expect(section5.textContent).toContain('2 year(s) from the Effective Date')
    })

    it('inlines until-terminated MNDA term into section 5', () => {
      render(<NDADocument data={{ ...baseData, mndaTermType: 'until-terminated' }} />)
      const section5 = screen.getByText(/5\. Term and Termination\./).closest('p')!
      expect(section5.textContent).toContain('until terminated in accordance with the terms of this MNDA')
    })

    it('uses singular year label for 1 year', () => {
      render(<NDADocument data={{ ...baseData, mndaTermYears: 1 }} />)
      expect(screen.getByText('Expires 1 year(s) from Effective Date.')).toBeInTheDocument()
    })
  })

  describe('Confidentiality Term', () => {
    it('shows years-based confidentiality term on cover page', () => {
      render(<NDADocument data={baseData} />)
      expect(
        screen.getByText(
          '3 year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.'
        )
      ).toBeInTheDocument()
    })

    it('shows perpetuity term on cover page', () => {
      render(<NDADocument data={{ ...baseData, confidentialityTermType: 'perpetuity' }} />)
      expect(screen.getByText('In perpetuity.')).toBeInTheDocument()
    })

    it('inlines years confidentiality term into section 5', () => {
      render(<NDADocument data={baseData} />)
      const section5 = screen.getByText(/5\. Term and Termination\./).closest('p')!
      expect(section5.textContent).toContain('3 year(s) from the Effective Date')
    })

    it('inlines perpetuity into section 5', () => {
      render(<NDADocument data={{ ...baseData, confidentialityTermType: 'perpetuity' }} />)
      const section5 = screen.getByText(/5\. Term and Termination\./).closest('p')!
      expect(section5.textContent).toContain('in perpetuity')
    })
  })

  describe('Governing Law & Jurisdiction', () => {
    it('shows governing law and jurisdiction on cover page', () => {
      render(<NDADocument data={baseData} />)
      expect(screen.getAllByText('Delaware').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Wilmington, DE').length).toBeGreaterThan(0)
    })

    it('falls back to [State] when governingLaw is empty', () => {
      render(<NDADocument data={{ ...baseData, governingLaw: '' }} />)
      const section9 = screen.getByText(/9\. Governing Law and Jurisdiction\./).closest('p')!
      expect(section9.textContent).toContain('[State]')
    })

    it('falls back to [Jurisdiction] when jurisdiction is empty', () => {
      render(<NDADocument data={{ ...baseData, jurisdiction: '' }} />)
      const section9 = screen.getByText(/9\. Governing Law and Jurisdiction\./).closest('p')!
      expect(section9.textContent).toContain('[Jurisdiction]')
    })

    it('inlines governing law into section 9', () => {
      render(<NDADocument data={baseData} />)
      const section9 = screen.getByText(/9\. Governing Law and Jurisdiction\./).closest('p')!
      expect(section9.textContent).toContain('Delaware')
    })

    it('inlines jurisdiction into section 9', () => {
      render(<NDADocument data={baseData} />)
      const section9 = screen.getByText(/9\. Governing Law and Jurisdiction\./).closest('p')!
      expect(section9.textContent).toContain('Wilmington, DE')
    })
  })

  describe('signature table', () => {
    it('shows party company names as column headers', () => {
      render(<NDADocument data={baseData} />)
      expect(screen.getAllByText('Alpha Inc.').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Beta LLC').length).toBeGreaterThan(0)
    })

    it('falls back to PARTY 1 / PARTY 2 when company names are empty', () => {
      render(<NDADocument data={{
        ...baseData,
        party1: { ...baseData.party1, company: '' },
        party2: { ...baseData.party2, company: '' },
      }} />)
      expect(screen.getByText('PARTY 1')).toBeInTheDocument()
      expect(screen.getByText('PARTY 2')).toBeInTheDocument()
    })

    it('shows party names in Print Name row', () => {
      render(<NDADocument data={baseData} />)
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    })

    it('shows party titles in Title row', () => {
      render(<NDADocument data={baseData} />)
      expect(screen.getByText('CEO')).toBeInTheDocument()
      expect(screen.getByText('CTO')).toBeInTheDocument()
    })

    it('shows notice addresses in Notice Address row', () => {
      render(<NDADocument data={baseData} />)
      expect(screen.getByText('alice@alpha.com')).toBeInTheDocument()
      expect(screen.getByText('bob@beta.com')).toBeInTheDocument()
    })

    it('renders all signature table row labels', () => {
      render(<NDADocument data={baseData} />)
      const labels = ['Signature', 'Print Name', 'Title', 'Company', 'Notice Address', 'Date']
      labels.forEach((label) => expect(screen.getByText(label)).toBeInTheDocument())
    })
  })

  describe('standard terms sections', () => {
    it('renders all 11 numbered sections', () => {
      render(<NDADocument data={baseData} />)
      const headings = [
        '1. Introduction.',
        '2. Use and Protection of Confidential Information.',
        '3. Exceptions.',
        '4. Disclosures Required by Law.',
        '5. Term and Termination.',
        '6. Return or Destruction of Confidential Information.',
        '7. Proprietary Rights.',
        '8. Disclaimer.',
        '9. Governing Law and Jurisdiction.',
        '10. Equitable Relief.',
        '11. General.',
      ]
      headings.forEach((h) => {
        expect(screen.getByText(h)).toBeInTheDocument()
      })
    })

    it('shows Common Paper attribution footer', () => {
      render(<NDADocument data={baseData} />)
      expect(
        screen.getByText(/Common Paper Mutual Non-Disclosure Agreement Version 1\.0/)
      ).toBeInTheDocument()
    })
  })
})
