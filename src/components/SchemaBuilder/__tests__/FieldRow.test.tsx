import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FieldRow } from '../FieldRow'
import type { FieldSchema } from '../../../types'

// dnd-kit needs a DndContext wrapper; use a simple stub
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}))
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

const field: FieldSchema = {
  id: '1', key: 'name', label: 'Full Name', type: 'string', required: true,
}

describe('FieldRow', () => {
  it('shows label in collapsed state', () => {
    render(<FieldRow field={field} isExpanded={false} allKeys={[]} onExpand={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('Full Name')).toBeInTheDocument()
  })

  it('shows key when label is empty', () => {
    render(<FieldRow field={{ ...field, label: '' }} isExpanded={false} allKeys={[]} onExpand={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('name')).toBeInTheDocument()
  })

  it('shows "Untitled field" when both label and key are empty', () => {
    render(<FieldRow field={{ ...field, label: '', key: '' }} isExpanded={false} allKeys={[]} onExpand={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('Untitled field')).toBeInTheDocument()
  })

  it('shows type badge', () => {
    render(<FieldRow field={field} isExpanded={false} allKeys={[]} onExpand={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('String')).toBeInTheDocument()
  })

  it('shows Required badge when required', () => {
    render(<FieldRow field={field} isExpanded={false} allKeys={[]} onExpand={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('calls onExpand when row header is clicked', () => {
    const onExpand = vi.fn()
    render(<FieldRow field={field} isExpanded={false} allKeys={[]} onExpand={onExpand} onUpdate={vi.fn()} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByText('Full Name'))
    expect(onExpand).toHaveBeenCalledWith('1')
  })

  it('calls onRemove when delete button is clicked', () => {
    const onRemove = vi.fn()
    render(<FieldRow field={field} isExpanded={false} allKeys={[]} onExpand={vi.fn()} onUpdate={vi.fn()} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onRemove).toHaveBeenCalledWith('1')
  })

  it('renders FieldEditor when expanded', () => {
    render(<FieldRow field={field} isExpanded={true} allKeys={[]} onExpand={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByLabelText(/key/i)).toBeInTheDocument()
  })
})
