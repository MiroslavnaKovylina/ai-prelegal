import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

describe('Home page', () => {
  describe('layout', () => {
    it('renders the Mutual NDA Creator header', () => {
      render(<Home />)
      expect(screen.getByRole('heading', { name: 'Mutual NDA Creator' })).toBeInTheDocument()
    })

    it('renders the Download PDF button', () => {
      render(<Home />)
      expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
    })

    it('renders the form panel', () => {
      render(<Home />)
      expect(screen.getByText('Agreement Details')).toBeInTheDocument()
    })

    it('renders the document preview panel', () => {
      render(<Home />)
      expect(
        screen.getByRole('heading', { name: /Mutual Non-Disclosure Agreement/i, level: 1 })
      ).toBeInTheDocument()
    })
  })

  describe('initial state', () => {
    it('pre-fills purpose with default evaluating-a-business-relationship text', () => {
      render(<Home />)
      expect(
        screen.getByDisplayValue('Evaluating whether to enter into a business relationship with the other party.')
      ).toBeInTheDocument()
    })

    it('shows default purpose in the live document preview', () => {
      render(<Home />)
      const purposeOccurrences = screen.getAllByText(
        'Evaluating whether to enter into a business relationship with the other party.'
      )
      expect(purposeOccurrences.length).toBeGreaterThanOrEqual(2)
    })

    it('initialises with MNDA Term years radio checked', () => {
      render(<Home />)
      expect(screen.getByRole('radio', { name: /expires/i })).toBeChecked()
    })

    it('shows [State] and [Jurisdiction] placeholders in document when fields are empty', () => {
      render(<Home />)
      const section9 = screen.getByText(/9\. Governing Law and Jurisdiction\./).closest('p')!
      expect(section9.textContent).toContain('[State]')
      expect(section9.textContent).toContain('[Jurisdiction]')
    })
  })

  describe('live preview sync (form → document)', () => {
    it('updates document purpose when user types in the Purpose textarea', async () => {
      const user = userEvent.setup()
      render(<Home />)
      const textarea = screen.getByDisplayValue(
        'Evaluating whether to enter into a business relationship with the other party.'
      )
      await user.clear(textarea)
      await user.type(textarea, 'Discussing an acquisition')
      const section1 = screen.getByText(/1\. Introduction\./).closest('p')!
      expect(section1.textContent).toContain('Discussing an acquisition')
    })

    it('updates governing law in the document when user types in that field', async () => {
      const user = userEvent.setup()
      render(<Home />)
      const input = screen.getByLabelText('Governing Law (State)')
      await user.type(input, 'Nevada')
      const section9 = screen.getByText(/9\. Governing Law and Jurisdiction\./).closest('p')!
      expect(section9.textContent).toContain('Nevada')
    })

    it('updates jurisdiction in the document when user types in that field', async () => {
      const user = userEvent.setup()
      render(<Home />)
      const input = screen.getByLabelText('Jurisdiction')
      await user.type(input, 'Las Vegas, NV')
      const section9 = screen.getByText(/9\. Governing Law and Jurisdiction\./).closest('p')!
      expect(section9.textContent).toContain('Las Vegas, NV')
    })

    it('switches document to until-terminated wording when that radio is selected', async () => {
      const user = userEvent.setup()
      render(<Home />)
      await user.click(screen.getByRole('radio', { name: /continues until terminated/i }))
      expect(
        screen.getByText('Continues until terminated in accordance with the terms of the MNDA.')
      ).toBeInTheDocument()
    })

    it('updates party company headers in the signature table when user fills in companies', async () => {
      const user = userEvent.setup()
      render(<Home />)
      const companyInputs = screen.getAllByLabelText('Company')
      await user.type(companyInputs[0], 'TechCo')
      await user.type(companyInputs[1], 'FinCo')
      expect(screen.getAllByText('TechCo').length).toBeGreaterThan(0)
      expect(screen.getAllByText('FinCo').length).toBeGreaterThan(0)
    })

    it('shows party name in signature table after typing', async () => {
      const user = userEvent.setup()
      render(<Home />)
      const nameInputs = screen.getAllByLabelText('Full Name')
      await user.type(nameInputs[0], 'Maria Garcia')
      expect(screen.getAllByText('Maria Garcia').length).toBeGreaterThan(0)
    })
  })

  describe('Download PDF button', () => {
    it('calls window.print() when Download PDF is clicked', async () => {
      const user = userEvent.setup()
      const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {})
      render(<Home />)
      await user.click(screen.getByRole('button', { name: 'Download PDF' }))
      expect(printSpy).toHaveBeenCalledTimes(1)
      printSpy.mockRestore()
    })
  })
})
