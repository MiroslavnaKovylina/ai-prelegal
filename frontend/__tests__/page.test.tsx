import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

const GREETING = "Hello! I'll help you fill in your Mutual NDA. What is the purpose of this agreement?"

function makeFetchResponse(fields: Record<string, unknown> = {}) {
  return {
    json: jest.fn().mockResolvedValue({
      message: GREETING,
      fields: {
        purpose: null, effectiveDate: null,
        mndaTermType: null, mndaTermYears: null,
        confidentialityTermType: null, confidentialityTermYears: null,
        governingLaw: null, jurisdiction: null,
        party1: null, party2: null,
        ...fields,
      },
    }),
  }
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue(makeFetchResponse()) as jest.Mock
})

afterEach(() => {
  jest.resetAllMocks()
})

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

    it('renders the chat input', () => {
      render(<Home />)
      expect(screen.getByPlaceholderText('Type a message…')).toBeInTheDocument()
    })

    it('renders the document preview panel with NDA heading', () => {
      render(<Home />)
      expect(
        screen.getByRole('heading', { name: /Mutual Non-Disclosure Agreement/i, level: 1 })
      ).toBeInTheDocument()
    })
  })

  describe('NDA document default state', () => {
    it('shows default purpose text in the document preview', () => {
      render(<Home />)
      expect(
        screen.getAllByText('Evaluating whether to enter into a business relationship with the other party.').length
      ).toBeGreaterThanOrEqual(1)
    })

    it('shows [State] and [Jurisdiction] placeholders when fields are empty', () => {
      render(<Home />)
      const section9 = screen.getByText(/9\. Governing Law and Jurisdiction\./).closest('p')!
      expect(section9.textContent).toContain('[State]')
      expect(section9.textContent).toContain('[Jurisdiction]')
    })
  })

  describe('AI chat', () => {
    it('calls /api/chat on mount with empty messages', async () => {
      render(<Home />)
      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/chat',
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ messages: [] }) })
        )
      )
    })

    it('displays the AI greeting after mount', async () => {
      render(<Home />)
      await waitFor(() => expect(screen.getByText(GREETING)).toBeInTheDocument())
    })

    it('sends user message and shows it in the chat', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce(makeFetchResponse())
        .mockResolvedValueOnce(makeFetchResponse())

      render(<Home />)
      await waitFor(() => screen.getByText(GREETING))

      await user.type(screen.getByPlaceholderText('Type a message…'), 'Exploring a partnership')
      await user.click(screen.getByRole('button', { name: 'Send' }))

      await waitFor(() =>
        expect(screen.getByText('Exploring a partnership')).toBeInTheDocument()
      )
    })

    it('merges AI-returned fields into the NDA document', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce(makeFetchResponse())
        .mockResolvedValueOnce(makeFetchResponse({ governingLaw: 'Nevada' }))

      render(<Home />)
      await waitFor(() => screen.getByText(GREETING))

      await user.type(screen.getByPlaceholderText('Type a message…'), 'Nevada law governs')
      await user.click(screen.getByRole('button', { name: 'Send' }))

      await waitFor(() => {
        const section9 = screen.getByText(/9\. Governing Law and Jurisdiction\./).closest('p')!
        expect(section9.textContent).toContain('Nevada')
      })
    })
  })

  describe('Download PDF button', () => {
    it('calls window.print() when clicked', async () => {
      const user = userEvent.setup()
      const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {})
      render(<Home />)
      await user.click(screen.getByRole('button', { name: 'Download PDF' }))
      expect(printSpy).toHaveBeenCalledTimes(1)
      printSpy.mockRestore()
    })
  })
})
