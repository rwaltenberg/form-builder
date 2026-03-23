import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormSchema } from '../useFormSchema'

describe('useFormSchema', () => {
  it('starts with an empty schema', () => {
    const { result } = renderHook(() => useFormSchema())
    expect(result.current.schema).toEqual([])
  })

  it('addField appends a field with defaults', () => {
    const { result } = renderHook(() => useFormSchema())
    act(() => result.current.addField())
    expect(result.current.schema).toHaveLength(1)
    expect(result.current.schema[0].type).toBe('string')
    expect(result.current.schema[0].required).toBe(false)
    expect(result.current.schema[0].key).toBe('')
  })

  it('addField sets the new field as expanded', () => {
    const { result } = renderHook(() => useFormSchema())
    act(() => result.current.addField())
    const id = result.current.schema[0].id
    expect(result.current.expandedFieldId).toBe(id)
  })

  it('updateField merges partial updates', () => {
    const { result } = renderHook(() => useFormSchema())
    act(() => result.current.addField())
    const id = result.current.schema[0].id
    act(() => result.current.updateField(id, { key: 'emp_id', label: 'Employee ID' }))
    expect(result.current.schema[0].key).toBe('emp_id')
    expect(result.current.schema[0].label).toBe('Employee ID')
  })

  it('removeField removes the field by id', () => {
    const { result } = renderHook(() => useFormSchema())
    act(() => result.current.addField())
    const id = result.current.schema[0].id
    act(() => result.current.removeField(id))
    expect(result.current.schema).toHaveLength(0)
  })

  it('reorderFields moves a field', () => {
    const { result } = renderHook(() => useFormSchema())
    act(() => { result.current.addField(); result.current.addField() })
    const [first, second] = result.current.schema
    act(() => result.current.reorderFields(second.id, first.id))
    expect(result.current.schema[0].id).toBe(second.id)
  })

  it('reorderFields is a no-op when overId is null', () => {
    const { result } = renderHook(() => useFormSchema())
    act(() => { result.current.addField(); result.current.addField() })
    const before = result.current.schema.map(f => f.id)
    act(() => result.current.reorderFields(before[0], null))
    expect(result.current.schema.map(f => f.id)).toEqual(before)
  })

  it('setExpandedFieldId updates the expanded field', () => {
    const { result } = renderHook(() => useFormSchema())
    act(() => result.current.addField())
    const id = result.current.schema[0].id
    act(() => result.current.setExpandedFieldId(null))
    expect(result.current.expandedFieldId).toBeNull()
    act(() => result.current.setExpandedFieldId(id))
    expect(result.current.expandedFieldId).toBe(id)
  })

  it('importSchema replaces state', () => {
    const { result } = renderHook(() => useFormSchema())
    act(() => result.current.addField())
    const newSchema = [{ id: 'x', key: 'role', label: 'Role', type: 'enum' as const, required: true, enumOptions: ['a'] }]
    act(() => result.current.importSchema(newSchema))
    expect(result.current.schema).toHaveLength(1)
    expect(result.current.schema[0].key).toBe('role')
  })
})
