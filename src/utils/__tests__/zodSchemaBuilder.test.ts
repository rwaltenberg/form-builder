import { describe, it, expect } from 'vitest'
import { buildZodSchema } from '../zodSchemaBuilder'
import type { FormSchema } from '../../types'

describe('buildZodSchema', () => {
  it('returns a zod object schema', () => {
    const schema = buildZodSchema([])
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('validates a required string field', () => {
    const fields: FormSchema = [
      { id: '1', key: 'name', label: 'Name', type: 'string', required: true },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ name: '' }).success).toBe(false)
    expect(schema.safeParse({ name: 'Alice' }).success).toBe(true)
  })

  it('validates string min/max length', () => {
    const fields: FormSchema = [
      { id: '1', key: 'bio', label: 'Bio', type: 'string', required: false, validation: { min: 2, max: 5 } },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ bio: 'a' }).success).toBe(false)
    expect(schema.safeParse({ bio: 'abc' }).success).toBe(true)
    expect(schema.safeParse({ bio: 'toolong' }).success).toBe(false)
  })

  it('validates string regex pattern', () => {
    const fields: FormSchema = [
      { id: '1', key: 'code', label: 'Code', type: 'string', required: false, validation: { pattern: '^[A-Z]+$' } },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ code: 'abc' }).success).toBe(false)
    expect(schema.safeParse({ code: 'ABC' }).success).toBe(true)
  })

  it('silently skips invalid regex pattern', () => {
    const fields: FormSchema = [
      { id: '1', key: 'val', label: 'Val', type: 'string', required: false, validation: { pattern: '[invalid' } },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ val: 'anything' }).success).toBe(true)
  })

  it('validates a required number field', () => {
    const fields: FormSchema = [
      { id: '1', key: 'age', label: 'Age', type: 'number', required: true },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ age: undefined }).success).toBe(false)
    expect(schema.safeParse({ age: 25 }).success).toBe(true)
  })

  it('validates number min/max', () => {
    const fields: FormSchema = [
      { id: '1', key: 'score', label: 'Score', type: 'number', required: false, validation: { min: 0, max: 100 } },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ score: -1 }).success).toBe(false)
    expect(schema.safeParse({ score: 50 }).success).toBe(true)
    expect(schema.safeParse({ score: 101 }).success).toBe(false)
  })

  it('validates boolean field', () => {
    const fields: FormSchema = [
      { id: '1', key: 'active', label: 'Active', type: 'boolean', required: false },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ active: true }).success).toBe(true)
    expect(schema.safeParse({ active: false }).success).toBe(true)
  })

  it('validates enum field with options', () => {
    const fields: FormSchema = [
      { id: '1', key: 'role', label: 'Role', type: 'enum', required: false, enumOptions: ['admin', 'user'] },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ role: 'admin' }).success).toBe(true)
    expect(schema.safeParse({ role: 'other' }).success).toBe(false)
  })

  it('falls back to z.string() for enum with no options', () => {
    const fields: FormSchema = [
      { id: '1', key: 'role', label: 'Role', type: 'enum', required: false, enumOptions: [] },
    ]
    const schema = buildZodSchema(fields)
    expect(schema.safeParse({ role: 'anything' }).success).toBe(true)
  })
})
