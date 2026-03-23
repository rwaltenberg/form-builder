import { describe, it, expect } from 'vitest'
import { slugify } from '../slugify'

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('HELLO')).toBe('hello')
  })

  it('replaces spaces with underscores', () => {
    expect(slugify('hello world')).toBe('hello_world')
  })

  it('strips non-alphanumeric, non-underscore characters', () => {
    expect(slugify('Employee ID!')).toBe('employee_id')
  })

  it('handles multiple spaces', () => {
    expect(slugify('first  last')).toBe('first__last')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('preserves existing underscores', () => {
    expect(slugify('my_field')).toBe('my_field')
  })

  it('strips leading/trailing special characters', () => {
    expect(slugify('!hello!')).toBe('hello')
  })
})
