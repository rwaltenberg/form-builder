import { test, expect } from '@playwright/test'

test.describe('Schema Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows both panel headings on load', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Form Builder' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Live Preview' })).toBeVisible()
  })

  test('shows empty state hint in the preview panel on load', async ({ page }) => {
    await expect(page.getByText('Add fields in the builder to see a preview.')).toBeVisible()
  })

  test('adds a field and shows it in the builder', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Field' }).first().click()
    await expect(page.getByText('Untitled field').first()).toBeVisible()
  })

  test('new field editor opens automatically when field is added', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Field' }).first().click()
    await expect(page.getByPlaceholder('e.g. Employee ID').first()).toBeVisible()
  })

  test('key auto-fills from label as you type', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Field' }).first().click()
    await page.getByPlaceholder('e.g. Employee ID').first().fill('Full Name')
    await expect(page.getByPlaceholder('e.g. employee_id').first()).toHaveValue('full_name')
  })

  test('row header updates to show the typed label', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Field' }).first().click()
    await page.getByPlaceholder('e.g. Employee ID').first().fill('First Name')
    // Header is always visible even while the editor is expanded
    await expect(page.getByRole('button', { name: /first name/i }).first()).toBeVisible()
  })

  test('manually editing key breaks auto-fill from label', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Field' }).first().click()
    await page.getByPlaceholder('e.g. employee_id').first().fill('my_custom_key')
    await page.getByPlaceholder('e.g. Employee ID').first().fill('Something Else')
    await expect(page.getByPlaceholder('e.g. employee_id').first()).toHaveValue('my_custom_key')
  })

  test('deletes a field', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Field' }).first().click()
    await page.getByRole('button', { name: 'Delete field' }).first().click()
    await expect(page.getByText('Untitled field')).not.toBeVisible()
    await expect(page.getByText('Add fields in the builder to see a preview.')).toBeVisible()
  })

  test('export button is disabled when schema is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Export' })).toBeDisabled()
  })

  test('export button enables once a field is added', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Field' }).first().click()
    await expect(page.getByRole('button', { name: 'Export' })).toBeEnabled()
  })
})
