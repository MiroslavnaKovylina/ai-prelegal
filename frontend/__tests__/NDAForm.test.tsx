import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NDAForm from '@/components/NDAForm'
import { NDAFormData, defaultFormData } from '@/types/nda'

function renderForm(data: NDAFormData = defaultFormData, onChange = jest.fn()) {
  render(<NDAForm data={data} onChange={onChange} />)
  return { onChange }
}

describe('NDAForm', () => {
  describe('section headings', () => {
    it('renders Agreement Details section', () => {
      renderForm()
      expect(screen.getByText('Agreement Details')).toBeInTheDocument()
    })

    it('renders Terms section', () => {
      renderForm()
      expect(screen.getByText('Terms')).toBeInTheDocument()
    })

    it('renders Governing Law & Jurisdiction section', () => {
      renderForm()
      expect(screen.getByText('Governing Law & Jurisdiction')).toBeInTheDocument()
    })

    it('renders Parties section', () => {
      renderForm()
      expect(screen.getByText('Parties')).toBeInTheDocument()
    })
  })

  describe('Purpose textarea', () => {
    it('renders with current purpose value', () => {
      renderForm({ ...defaultFormData, purpose: 'Some purpose text' })
      expect(screen.getByDisplayValue('Some purpose text')).toBeInTheDocument()
    })

    it('calls onChange with updated purpose when typed into', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm()
      const textarea = screen.getByLabelText(/purpose/i)
      await user.type(textarea, 'X')
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ purpose: defaultFormData.purpose + 'X' })
      )
    })
  })

  describe('Effective Date input', () => {
    it('renders with current effective date', () => {
      renderForm({ ...defaultFormData, effectiveDate: '2025-06-01' })
      expect(screen.getByDisplayValue('2025-06-01')).toBeInTheDocument()
    })

    it('calls onChange with new date when changed', () => {
      const { onChange } = renderForm()
      const dateInput = screen.getByLabelText('Effective Date')
      fireEvent.change(dateInput, { target: { value: '2026-01-01' } })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ effectiveDate: '2026-01-01' })
      )
    })
  })

  describe('MNDA Term radio group', () => {
    it('renders "Expires" radio option', () => {
      renderForm()
      expect(screen.getByRole('radio', { name: /expires/i })).toBeInTheDocument()
    })

    it('renders "Continues until terminated" radio option', () => {
      renderForm()
      expect(screen.getByRole('radio', { name: /continues until terminated/i })).toBeInTheDocument()
    })

    it('has "years" radio checked by default', () => {
      renderForm()
      const expiresRadio = screen.getByRole('radio', { name: /expires/i })
      expect(expiresRadio).toBeChecked()
    })

    it('calls onChange with mndaTermType: until-terminated when that radio is selected', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm()
      await user.click(screen.getByRole('radio', { name: /continues until terminated/i }))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ mndaTermType: 'until-terminated' })
      )
    })

    it('calls onChange with mndaTermType: years when years radio is selected', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm({ ...defaultFormData, mndaTermType: 'until-terminated' })
      await user.click(screen.getByRole('radio', { name: /expires/i }))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ mndaTermType: 'years' })
      )
    })

    it('MNDA term years input is disabled when until-terminated is selected', () => {
      renderForm({ ...defaultFormData, mndaTermType: 'until-terminated' })
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs[0]).toBeDisabled()
    })

    it('MNDA term years input is enabled when years is selected', () => {
      renderForm({ ...defaultFormData, mndaTermType: 'years' })
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs[0]).not.toBeDisabled()
    })

    it('updates mndaTermYears when number input changes', () => {
      const { onChange } = renderForm()
      const inputs = screen.getAllByRole('spinbutton')
      fireEvent.change(inputs[0], { target: { value: '5' } })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ mndaTermYears: 5 })
      )
    })
  })

  describe('Confidentiality Term radio group', () => {
    it('renders years and perpetuity radio options', () => {
      renderForm()
      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(4)
    })

    it('has "years" radio checked by default for confidentiality', () => {
      renderForm()
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs[1]).not.toBeDisabled()
    })

    it('calls onChange with confidentialityTermType: perpetuity when selected', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm()
      await user.click(screen.getByRole('radio', { name: /in perpetuity/i }))
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ confidentialityTermType: 'perpetuity' })
      )
    })

    it('confidentiality years input is disabled when perpetuity is selected', () => {
      renderForm({ ...defaultFormData, confidentialityTermType: 'perpetuity' })
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs[1]).toBeDisabled()
    })

    it('updates confidentialityTermYears when number input changes', () => {
      const { onChange } = renderForm()
      const inputs = screen.getAllByRole('spinbutton')
      fireEvent.change(inputs[1], { target: { value: '10' } })
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ confidentialityTermYears: 10 })
      )
    })
  })

  describe('Governing Law & Jurisdiction fields', () => {
    it('renders Governing Law input with placeholder', () => {
      renderForm()
      expect(screen.getByPlaceholderText('e.g., Delaware')).toBeInTheDocument()
    })

    it('renders Jurisdiction input with placeholder', () => {
      renderForm()
      expect(screen.getByPlaceholderText('e.g., New Castle, DE')).toBeInTheDocument()
    })

    it('calls onChange with updated governing law', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm()
      const input = screen.getByLabelText('Governing Law (State)')
      await user.type(input, 'C')
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ governingLaw: 'C' })
      )
    })

    it('calls onChange with updated jurisdiction', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm()
      const input = screen.getByLabelText('Jurisdiction')
      await user.type(input, 'S')
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ jurisdiction: 'S' })
      )
    })
  })

  describe('Party fields', () => {
    it('renders Party 1 and Party 2 subsections', () => {
      renderForm()
      expect(screen.getByText('Party 1')).toBeInTheDocument()
      expect(screen.getByText('Party 2')).toBeInTheDocument()
    })

    it('renders all party field labels twice (one per party)', () => {
      renderForm()
      expect(screen.getAllByLabelText('Full Name')).toHaveLength(2)
      expect(screen.getAllByLabelText('Title')).toHaveLength(2)
      expect(screen.getAllByLabelText('Company')).toHaveLength(2)
      expect(screen.getAllByLabelText('Notice Address (email or postal)')).toHaveLength(2)
    })

    it('populates party1 field values from data', () => {
      renderForm({
        ...defaultFormData,
        party1: { name: 'Jane Doe', title: 'CFO', company: 'Widgets Co', address: 'jane@widgets.com' },
      })
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('CFO')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Widgets Co')).toBeInTheDocument()
      expect(screen.getByDisplayValue('jane@widgets.com')).toBeInTheDocument()
    })

    it('calls onChange with updated party1 name', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm()
      const nameInputs = screen.getAllByLabelText('Full Name')
      await user.type(nameInputs[0], 'A')
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          party1: expect.objectContaining({ name: 'A' }),
        })
      )
    })

    it('calls onChange with updated party2 name', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm()
      const nameInputs = screen.getAllByLabelText('Full Name')
      await user.type(nameInputs[1], 'B')
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          party2: expect.objectContaining({ name: 'B' }),
        })
      )
    })

    it('calls onChange with updated party1 company', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm()
      const companyInputs = screen.getAllByLabelText('Company')
      await user.type(companyInputs[0], 'A')
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          party1: expect.objectContaining({ company: 'A' }),
        })
      )
    })

    it('calls onChange with updated party2 address', async () => {
      const user = userEvent.setup()
      const { onChange } = renderForm()
      const addressInputs = screen.getAllByLabelText('Notice Address (email or postal)')
      await user.type(addressInputs[1], 'p')
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          party2: expect.objectContaining({ address: 'p' }),
        })
      )
    })
  })

  describe('field placeholders', () => {
    it('shows Jane Smith placeholder for Full Name', () => {
      renderForm()
      expect(screen.getAllByPlaceholderText('Jane Smith')).toHaveLength(2)
    })

    it('shows CEO placeholder for Title', () => {
      renderForm()
      expect(screen.getAllByPlaceholderText('CEO')).toHaveLength(2)
    })

    it('shows Acme Corp placeholder for Company', () => {
      renderForm()
      expect(screen.getAllByPlaceholderText('Acme Corp')).toHaveLength(2)
    })

    it('shows email placeholder for notice address', () => {
      renderForm()
      expect(screen.getAllByPlaceholderText('jane@acme.com')).toHaveLength(2)
    })
  })
})
