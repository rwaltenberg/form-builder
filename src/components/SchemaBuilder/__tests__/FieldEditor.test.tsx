import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldEditor } from '../FieldEditor'
import type { FieldSchema } from '../../../types'

const baseField: FieldSchema = {
  id: '1',
  key: 'emp_id',
  label: 'Employee ID',
  type: 'string',
  required: false,
}

describe('FieldEditor', () => {
  it('renders key and label inputs with current values', () => {
    render(<FieldEditor field={baseField} allKeys={[]} onUpdate={vi.fn()} />)
    expect(screen.getByDisplayValue('emp_id')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Employee ID')).toBeInTheDocument()
  })

  it('calls onUpdate with slugified key on key change', async () => {
    const onUpdate = vi.fn()
    render(<FieldEditor field={baseField} allKeys={[]} onUpdate={onUpdate} />)
    const keyInput = screen.getByDisplayValue('emp_id')
    await userEvent.clear(keyInput)
    await userEvent.type(keyInput, 'New Key!')
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'new_key' }))
  })

  it('shows duplicate key error on blur when key matches another', async () => {
    render(<FieldEditor field={baseField} allKeys={['other_key']} onUpdate={vi.fn()} />)
    const keyInput = screen.getByDisplayValue('emp_id')
    fireEvent.change(keyInput, { target: { value: 'other_key' } })
    fireEvent.blur(keyInput)
    expect(await screen.findByText(/duplicate/i)).toBeInTheDocument()
  })

  it('shows empty key error on blur when key is empty', async () => {
    render(<FieldEditor field={{ ...baseField, key: '' }} allKeys={[]} onUpdate={vi.fn()} />)
    const keyInput = screen.getByPlaceholderText(/e\.g\. employee_id/i)
    fireEvent.blur(keyInput)
    expect(await screen.findByText(/key.*required/i)).toBeInTheDocument()
  })

  it('shows validation fields for string type', () => {
    render(<FieldEditor field={baseField} allKeys={[]} onUpdate={vi.fn()} />)
    expect(screen.getByLabelText(/min length/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max length/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pattern/i)).toBeInTheDocument()
  })

  it('shows min/max value fields for number type', () => {
    render(<FieldEditor field={{ ...baseField, type: 'number' }} allKeys={[]} onUpdate={vi.fn()} />)
    expect(screen.getByLabelText(/min value/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max value/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/pattern/i)).not.toBeInTheDocument()
  })

  it('shows enum options editor for enum type', () => {
    render(<FieldEditor field={{ ...baseField, type: 'enum', enumOptions: ['admin'] }} allKeys={[]} onUpdate={vi.fn()} />)
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/add option/i)).toBeInTheDocument()
  })

  it('shows min > max advisory warning', () => {
    render(<FieldEditor field={{ ...baseField, validation: { min: 10, max: 5 } }} allKeys={[]} onUpdate={vi.fn()} />)
    expect(screen.getByText(/min.*max/i)).toBeInTheDocument()
  })

  it('clears validation when type changes to boolean', async () => {
    const onUpdate = vi.fn()
    render(<FieldEditor field={{ ...baseField, validation: { min: 1 } }} allKeys={[]} onUpdate={onUpdate} />)
    // Simulate type change via the Select (shadcn Select uses role=combobox)
    const trigger = screen.getByRole('combobox')
    await userEvent.click(trigger)
    const boolOption = await screen.findByRole('option', { name: /boolean/i })
    await userEvent.click(boolOption)
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ type: 'boolean', validation: undefined, enumOptions: undefined }))
  })
})
