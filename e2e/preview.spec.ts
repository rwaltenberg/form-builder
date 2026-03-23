import { test, expect, type Page } from '@playwright/test'

async function addField(page: Page, label: string, options?: { required?: boolean }) {
  await page.getByRole('button', { name: 'Add Field' }).first().click()
  await page.getByPlaceholder('e.g. Employee ID').first().fill(label)
  if (options?.required) {
    await page.getByRole('switch').first().click()
  }
}

test.describe('Live Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders a field in the preview after it is added', async ({ page }) => {
    await addField(page, 'Full Name')
    await expect(page.getByLabel('Full Name').first()).toBeVisible()
  })

  test('renders a Submit button when the schema has fields', async ({ page }) => {
    await addField(page, 'Full Name')
    await expect(page.getByRole('button', { name: 'Submit' }).first()).toBeVisible()
  })

  test('shows a required validation error when submitting an empty required field', async ({ page }) => {
    await addField(page, 'Full Name', { required: true })
    await page.getByRole('button', { name: 'Submit' }).first().click()
    await expect(page.getByText('This field is required')).toBeVisible()
  })

  test('clears validation error once the field is filled', async ({ page }) => {
    await addField(page, 'Full Name', { required: true })
    await page.getByRole('button', { name: 'Submit' }).first().click()
    await expect(page.getByText('This field is required')).toBeVisible()
    await page.getByLabel('Full Name').first().fill('Alice')
    await page.getByRole('button', { name: 'Submit' }).first().click()
    await expect(page.getByText('This field is required')).not.toBeVisible()
  })

  test('shows JSON output after a valid form submission', async ({ page }) => {
    await addField(page, 'Full Name')
    await page.getByLabel('Full Name').first().fill('Alice')
    await page.getByRole('button', { name: 'Submit' }).first().click()
    await expect(page.getByText('JSON Output')).toBeVisible()
    await expect(page.locator('pre').first()).toContainText('"full_name"')
    await expect(page.locator('pre').first()).toContainText('"Alice"')
  })

  test('shows string min-length validation error', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Field' }).first().click()
    await page.getByPlaceholder('e.g. Employee ID').first().fill('Code')
    await page.getByLabel('Min Length').first().fill('3')
    await page.getByLabel('Code').first().fill('ab')
    await page.getByRole('button', { name: 'Submit' }).first().click()
    await expect(page.getByText('Must be at least 3 characters')).toBeVisible()
  })

  test('preview resets when a field is removed', async ({ page }) => {
    await addField(page, 'Full Name')
    await expect(page.getByLabel('Full Name').first()).toBeVisible()
    await page.getByRole('button', { name: 'Delete field' }).first().click()
    await expect(page.getByText('Add fields in the builder to see a preview.')).toBeVisible()
  })

  test('adding multiple fields renders all of them in the preview', async ({ page }) => {
    await addField(page, 'First Name')
    await addField(page, 'Last Name')
    await expect(page.getByLabel('First Name').first()).toBeVisible()
    await expect(page.getByLabel('Last Name').first()).toBeVisible()
  })
})
