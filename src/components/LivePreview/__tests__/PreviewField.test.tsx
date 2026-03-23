import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { PreviewField } from '../PreviewField'
import type { FieldSchema } from '../../../types'

function Wrapper({ field }: { field: FieldSchema }) {
  const methods = useForm()
  return (
    <FormProvider {...methods}>
      <PreviewField field={field} error={undefined} />
    </FormProvider>
  )
}

describe('PreviewField', () => {
  it('renders a text input for string type', () => {
    render(<Wrapper field={{ id: '1', key: 'name', label: 'Name', type: 'string', required: false }} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  it('renders a number input for number type', () => {
    render(<Wrapper field={{ id: '1', key: 'age', label: 'Age', type: 'number', required: false }} />)
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })

  it('renders a switch for boolean type', () => {
    render(<Wrapper field={{ id: '1', key: 'active', label: 'Active', type: 'boolean', required: false }} />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders a select for enum type with options', () => {
    render(<Wrapper field={{ id: '1', key: 'role', label: 'Role', type: 'enum', required: false, enumOptions: ['admin', 'user'] }} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders a disabled select for enum with no options', () => {
    render(<Wrapper field={{ id: '1', key: 'role', label: 'Role', type: 'enum', required: false, enumOptions: [] }} />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('shows a required indicator when field is required', () => {
    render(<Wrapper field={{ id: '1', key: 'name', label: 'Name', type: 'string', required: true }} />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('shows error message when error is provided', () => {
    function ErrorWrapper() {
      const methods = useForm()
      return (
        <FormProvider {...methods}>
          <PreviewField
            field={{ id: '1', key: 'name', label: 'Name', type: 'string', required: true }}
            error={{ message: 'This field is required', type: 'required' }}
          />
        </FormProvider>
      )
    }
    render(<ErrorWrapper />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })
})
