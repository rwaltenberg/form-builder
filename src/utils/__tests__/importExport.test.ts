import { describe, it, expect } from 'vitest'
import { parseImportedSchema, formatImportError } from '../importExport'

describe('parseImportedSchema', () => {
  it('accepts a valid minimal field array', () => {
    const input = [{ key: 'name', label: 'Name', type: 'string' }]
    const result = parseImportedSchema(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data[0].key).toBe('name')
      expect(result.data[0].required).toBe(false)
      expect(result.data[0].id).toBeDefined()
    }
  })

  it('preserves id if provided', () => {
    const input = [{ id: 'abc-123', key: 'name', label: 'Name', type: 'string' }]
    const result = parseImportedSchema(input)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data[0].id).toBe('abc-123')
  })

  it('generates a new id if missing', () => {
    const input = [{ key: 'name', label: 'Name', type: 'string' }]
    const result = parseImportedSchema(input)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data[0].id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('defaults required to false if missing', () => {
    const input = [{ key: 'x', label: 'X', type: 'boolean' }]
    const result = parseImportedSchema(input)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data[0].required).toBe(false)
  })

  it('strips enumOptions for non-enum types', () => {
    const input = [{ key: 'x', label: 'X', type: 'string', enumOptions: ['a', 'b'] }]
    const result = parseImportedSchema(input)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data[0].enumOptions).toBeUndefined()
  })

  it('preserves enumOptions for enum type', () => {
    const input = [{ key: 'role', label: 'Role', type: 'enum', enumOptions: ['admin', 'user'] }]
    const result = parseImportedSchema(input)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data[0].enumOptions).toEqual(['admin', 'user'])
  })

  it('strips validation for boolean type', () => {
    const input = [{ key: 'x', label: 'X', type: 'boolean', validation: { min: 1 } }]
    const result = parseImportedSchema(input)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data[0].validation).toBeUndefined()
  })

  it('rejects input that is not an array', () => {
    const result = parseImportedSchema({ key: 'x' })
    expect(result.success).toBe(false)
  })

  it('rejects field missing required key', () => {
    const result = parseImportedSchema([{ label: 'X', type: 'string' }])
    expect(result.success).toBe(false)
  })

  it('rejects field with invalid type', () => {
    const result = parseImportedSchema([{ key: 'x', label: 'X', type: 'date' }])
    expect(result.success).toBe(false)
  })

  it('strips unknown keys', () => {
    const input = [{ key: 'x', label: 'X', type: 'string', unknownField: 'value' }]
    const result = parseImportedSchema(input)
    expect(result.success).toBe(true)
    if (result.success) expect((result.data[0] as unknown as Record<string, unknown>).unknownField).toBeUndefined()
  })
})

describe('formatImportError', () => {
  it('formats a missing field error', () => {
    const issues = [{ path: [1, 'type'], message: 'Required', code: 'invalid_type', received: 'undefined', expected: 'string' }]
    const msg = formatImportError(issues as Parameters<typeof formatImportError>[0])
    expect(msg).toContain('Field 2')
    expect(msg).toContain('type')
  })
})
