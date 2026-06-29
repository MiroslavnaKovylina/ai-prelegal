import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

// Mock DocumentRenderer to avoid ESM issues with react-markdown in Jest
jest.mock('@/components/DocumentRenderer', () => ({
  __esModule: true,
  default: ({ filename, data }: { filename: string; data: Record<string, string | undefined> }) => (
    <div data-testid="document-renderer" data-filename={filename}>
      {Object.entries(data).map(([k, v]) => v ? <span key={k}>{v}</span> : null)}
    </div>
  ),
}))

const CATALOG = [
  {
    id: 'mutual-nda',
    name: 'Mutual Non-Disclosure Agreement',
    description: 'Standard terms for a mutual NDA.',
    filename: 'templates/Mutual-NDA.md',
  },
  {
    id: 'csa',
    name: 'Cloud Service Agreement',
    description: 'Comprehensive terms for cloud software.',
    filename: 'templates/CSA.md',
  },
]

const GREETING = "Hello! I'll help you fill out this document. What is the purpose of this agreement?"

function makeChatResponse(fields: Record<string, string | null> = {}) {
  return {
    json: jest.fn().mockResolvedValue({ message: GREETING, fields }),
  }
}

function makeCatalogResponse() {
  return {
    json: jest.fn().mockResolvedValue(CATALOG),
  }
}

function mockFetch(chatFields: Record<string, string | null> = {}) {
  ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url === '/api/catalog') return Promise.resolve(makeCatalogResponse())
    if (url === '/api/chat') return Promise.resolve(makeChatResponse(chatFields))
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
  })
}

beforeEach(() => {
  global.fetch = jest.fn() as jest.Mock
  mockFetch()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Landing page', () => {
  it('renders document catalog cards', async () => {
    render(<Home />)
    await waitFor(() =>
      expect(screen.getByText('Mutual Non-Disclosure Agreement')).toBeInTheDocument()
    )
    expect(screen.getByText('Cloud Service Agreement')).toBeInTheDocument()
  })

  it('shows document descriptions', async () => {
    render(<Home />)
    await waitFor(() =>
      expect(screen.getByText('Standard terms for a mutual NDA.')).toBeInTheDocument()
    )
  })

  it('shows loading state before catalog loads', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    render(<Home />)
    expect(screen.getByText('Loading documents…')).toBeInTheDocument()
  })
})

describe('Document selection', () => {
  it('navigates to chat view when a card is clicked', async () => {
    const user = userEvent.setup()
    render(<Home />)
    await waitFor(() => screen.getByText('Mutual Non-Disclosure Agreement'))

    await user.click(screen.getByText('Mutual Non-Disclosure Agreement'))

    await waitFor(() =>
      expect(screen.getByText(GREETING)).toBeInTheDocument()
    )
    expect(screen.getByPlaceholderText('Type a message…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
  })

  it('shows the document name as title in the header after selection', async () => {
    const user = userEvent.setup()
    render(<Home />)
    await waitFor(() => screen.getByText('Mutual Non-Disclosure Agreement'))

    await user.click(screen.getByText('Mutual Non-Disclosure Agreement'))

    await waitFor(() =>
      expect(
        screen.getByText('Mutual Non-Disclosure Agreement Creator')
      ).toBeInTheDocument()
    )
  })

  it('returns to landing page when Back is clicked', async () => {
    const user = userEvent.setup()
    render(<Home />)
    await waitFor(() => screen.getByText('Mutual Non-Disclosure Agreement'))

    await user.click(screen.getAllByText('Mutual Non-Disclosure Agreement')[0])
    await waitFor(() => screen.getByRole('button', { name: '← Back' }))

    await user.click(screen.getByRole('button', { name: '← Back' }))

    await waitFor(() =>
      expect(screen.getByText('Cloud Service Agreement')).toBeInTheDocument()
    )
  })
})

describe('Chat in document view', () => {
  async function openDoc(user: ReturnType<typeof userEvent.setup>) {
    render(<Home />)
    await waitFor(() => screen.getByText('Mutual Non-Disclosure Agreement'))
    await user.click(screen.getAllByText('Mutual Non-Disclosure Agreement')[0])
    await waitFor(() => screen.getByText(GREETING))
  }

  it('calls /api/chat with document_type on mount', async () => {
    const user = userEvent.setup()
    await openDoc(user)

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        body: JSON.stringify({ messages: [], document_type: 'mutual-nda' }),
      })
    )
  })

  it('sends user message and shows it in chat', async () => {
    const user = userEvent.setup()
    await openDoc(user)

    await user.type(screen.getByPlaceholderText('Type a message…'), 'Partnership exploration')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(screen.getByText('Partnership exploration')).toBeInTheDocument()
    )
  })

  it('passes field values down to the document renderer', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/catalog') return Promise.resolve(makeCatalogResponse())
      if (url === '/api/chat') {
        return Promise.resolve(
          makeChatResponse({ 'Governing Law': 'Nevada' })
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    render(<Home />)
    await waitFor(() => screen.getByText('Mutual Non-Disclosure Agreement'))
    await user.click(screen.getAllByText('Mutual Non-Disclosure Agreement')[0])

    await waitFor(() =>
      expect(screen.getByTestId('document-renderer')).toBeInTheDocument()
    )

    await user.type(screen.getByPlaceholderText('Type a message…'), 'Nevada governs')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() =>
      expect(screen.getByText('Nevada')).toBeInTheDocument()
    )
  })

  it('renders the document renderer with the correct filename', async () => {
    const user = userEvent.setup()
    await openDoc(user)

    const renderer = screen.getByTestId('document-renderer')
    expect(renderer).toHaveAttribute('data-filename', 'templates/Mutual-NDA.md')
  })

  it('calls window.print() when Download PDF is clicked', async () => {
    const user = userEvent.setup()
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {})
    await openDoc(user)

    await user.click(screen.getByRole('button', { name: 'Download PDF' }))
    expect(printSpy).toHaveBeenCalledTimes(1)
    printSpy.mockRestore()
  })
})
