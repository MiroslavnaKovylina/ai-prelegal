import { test, expect } from '@playwright/test'

test.describe('NDA Creator — page layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows the Mutual NDA Creator heading in the header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mutual NDA Creator' })).toBeVisible()
  })

  test('shows the Download PDF button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible()
  })

  test('shows the form panel with Agreement Details section', async ({ page }) => {
    await expect(page.getByText('Agreement Details')).toBeVisible()
  })

  test('shows the live document preview with MNDA title', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Mutual Non-Disclosure Agreement/i }).first()
    ).toBeVisible()
  })

  test('document preview is scrollable independently from the form', async ({ page }) => {
    const docPanel = page.locator('div.overflow-y-auto').nth(1)
    await expect(docPanel).toBeVisible()
  })
})

test.describe('NDA Creator — default state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('pre-populates Purpose with default evaluating text', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /purpose/i })
    await expect(textarea).toHaveValue(
      'Evaluating whether to enter into a business relationship with the other party.'
    )
  })

  test('has Expires radio selected by default for MNDA term', async ({ page }) => {
    const expiresRadio = page.getByRole('radio', { name: /expires/i })
    await expect(expiresRadio).toBeChecked()
  })

  test('shows fallback [State] in document section 9 when governing law is blank', async ({ page }) => {
    const section9 = page.getByText(/9\. Governing Law and Jurisdiction\./)
    await expect(section9).toContainText('[State]')
  })

  test('shows PARTY 1 / PARTY 2 as column headers when company names are blank', async ({ page }) => {
    await expect(page.getByText('PARTY 1')).toBeVisible()
    await expect(page.getByText('PARTY 2')).toBeVisible()
  })
})

test.describe('NDA Creator — live preview sync', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('typing in Purpose updates the document immediately', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /purpose/i })
    await textarea.clear()
    await textarea.fill('A strategic technology partnership')
    const section1 = page.getByText(/1\. Introduction\./)
    await expect(section1).toContainText('A strategic technology partnership')
  })

  test('typing in Governing Law updates section 9 in the document', async ({ page }) => {
    await page.getByLabel('Governing Law (State)').fill('Texas')
    const section9 = page.getByText(/9\. Governing Law and Jurisdiction\./)
    await expect(section9).toContainText('Texas')
  })

  test('typing in Jurisdiction updates section 9 in the document', async ({ page }) => {
    await page.getByLabel('Jurisdiction').fill('Austin, TX')
    const section9 = page.getByText(/9\. Governing Law and Jurisdiction\./)
    await expect(section9).toContainText('Austin, TX')
  })

  test('selecting until-terminated updates the cover page MNDA Term field', async ({ page }) => {
    await page.getByRole('radio', { name: /continues until terminated/i }).click()
    await expect(
      page.getByText('Continues until terminated in accordance with the terms of the MNDA.')
    ).toBeVisible()
  })

  test('selecting perpetuity updates the cover page confidentiality term field', async ({ page }) => {
    await page.getByRole('radio', { name: /in perpetuity/i }).click()
    await expect(page.getByText('In perpetuity.')).toBeVisible()
  })

  test('changing MNDA term years updates the document cover page', async ({ page }) => {
    await page.getByRole('radio', { name: /expires/i }).click()
    const yearInputs = page.getByRole('spinbutton')
    await yearInputs.first().fill('5')
    await expect(page.getByText('Expires 5 year(s) from Effective Date.')).toBeVisible()
  })

  test('typing party company names updates signature table column headers', async ({ page }) => {
    const companyInputs = page.getByLabel('Company')
    await companyInputs.first().fill('GloboCorp')
    await companyInputs.last().fill('TinyStartup')
    await expect(page.getByText('GloboCorp')).toBeVisible()
    await expect(page.getByText('TinyStartup')).toBeVisible()
  })

  test('typing party names updates the Print Name row in the signature table', async ({ page }) => {
    const nameInputs = page.getByLabel('Full Name')
    await nameInputs.first().fill('Samantha Lee')
    await expect(page.getByText('Samantha Lee')).toBeVisible()
  })

  test('typing party titles updates the Title row in the signature table', async ({ page }) => {
    const titleInputs = page.getByLabel('Title')
    await titleInputs.first().fill('VP Engineering')
    await expect(page.getByText('VP Engineering')).toBeVisible()
  })

  test('typing notice addresses updates the Notice Address row', async ({ page }) => {
    const addressInputs = page.getByLabel('Notice Address (email or postal)')
    await addressInputs.first().fill('ceo@example.com')
    await expect(page.getByText('ceo@example.com')).toBeVisible()
  })

  test('selecting a date updates the Effective Date in the document', async ({ page }) => {
    const dateInput = page.getByLabel('Effective Date')
    await dateInput.fill('2027-07-04')
    await expect(page.getByText('July 4, 2027')).toBeVisible()
  })
})

test.describe('NDA Creator — form validation and edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('MNDA term number input is disabled when until-terminated is selected', async ({ page }) => {
    await page.getByRole('radio', { name: /continues until terminated/i }).click()
    const yearInputs = page.getByRole('spinbutton')
    await expect(yearInputs.first()).toBeDisabled()
  })

  test('confidentiality term number input is disabled when perpetuity is selected', async ({ page }) => {
    await page.getByRole('radio', { name: /in perpetuity/i }).click()
    const yearInputs = page.getByRole('spinbutton')
    await expect(yearInputs.last()).toBeDisabled()
  })

  test('MNDA term input re-enables when switching back to years radio', async ({ page }) => {
    await page.getByRole('radio', { name: /continues until terminated/i }).click()
    await page.getByRole('radio', { name: /expires/i }).click()
    const yearInputs = page.getByRole('spinbutton')
    await expect(yearInputs.first()).toBeEnabled()
  })

  test('document shows all 11 standard terms sections', async ({ page }) => {
    for (let i = 1; i <= 11; i++) {
      await expect(page.getByText(new RegExp(`${i}\\.\\s`))).toBeVisible()
    }
  })

  test('document includes Common Paper attribution', async ({ page }) => {
    await expect(
      page.getByText(/Common Paper Mutual Non-Disclosure Agreement Version 1\.0/)
    ).toBeVisible()
  })
})

test.describe('NDA Creator — complete flow', () => {
  test('user can fill out the full form and see the completed document', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('textbox', { name: /purpose/i }).fill(
      'Evaluating a joint venture in renewable energy'
    )
    await page.getByLabel('Effective Date').fill('2026-09-01')

    await page.getByRole('radio', { name: /expires/i }).click()
    const yearInputs = page.getByRole('spinbutton')
    await yearInputs.first().fill('3')
    await yearInputs.last().fill('5')

    await page.getByLabel('Governing Law (State)').fill('California')
    await page.getByLabel('Jurisdiction').fill('San Francisco, CA')

    const nameInputs = page.getByLabel('Full Name')
    await nameInputs.first().fill('Jordan Rivera')
    await nameInputs.last().fill('Casey Patel')

    const titleInputs = page.getByLabel('Title')
    await titleInputs.first().fill('CEO')
    await titleInputs.last().fill('COO')

    const companyInputs = page.getByLabel('Company')
    await companyInputs.first().fill('GreenWave Inc.')
    await companyInputs.last().fill('SolarPath LLC')

    const addressInputs = page.getByLabel('Notice Address (email or postal)')
    await addressInputs.first().fill('jordan@greenwave.com')
    await addressInputs.last().fill('casey@solarpath.com')

    await expect(
      page.getByText('Evaluating a joint venture in renewable energy').first()
    ).toBeVisible()
    await expect(page.getByText('September 1, 2026')).toBeVisible()
    await expect(page.getByText('Expires 3 year(s) from Effective Date.')).toBeVisible()
    await expect(page.getByText('California')).toBeVisible()
    await expect(page.getByText('GreenWave Inc.')).toBeVisible()
    await expect(page.getByText('SolarPath LLC')).toBeVisible()
    await expect(page.getByText('Jordan Rivera')).toBeVisible()
    await expect(page.getByText('Casey Patel')).toBeVisible()
  })
})
