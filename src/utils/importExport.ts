import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import type { FormSchema, FieldSchema } from '../types'

const dataTypeSchema = z.enum(['string', 'number', 'boolean', 'enum'])

const rawFieldSchema = z.object({
  id: z.string().min(1).optional(),
  key: z.string(),
  label: z.string(),
  type: dataTypeSchema,
  required: z.boolean().optional(),
  enumOptions: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
}).strip()

const importSchema = z.array(rawFieldSchema)

type ParseResult =
  | { success: true; data: FormSchema }
  | { success: false; issues: z.ZodIssue[] }

export function parseImportedSchema(input: unknown): ParseResult {
  const result = importSchema.safeParse(input)
  if (!result.success) {
    return { success: false, issues: result.error.issues }
  }

  const fields: FormSchema = result.data.map((raw) => {
    const field: FieldSchema = {
      id: raw.id && raw.id.length > 0 ? raw.id : uuidv4(),
      key: raw.key,
      label: raw.label,
      type: raw.type,
      required: raw.required ?? false,
      enumOptions: raw.type === 'enum' ? raw.enumOptions : undefined,
      validation: (raw.type === 'string' || raw.type === 'number') ? raw.validation : undefined,
    }
    return field
  })

  return { success: true, data: fields }
}

export function formatImportError(issues: z.ZodIssue[]): string {
  const first = issues[0]
  if (!first) return 'Unknown error'
  const [index, field] = first.path
  if (typeof index === 'number' && field) {
    if (first.code === 'invalid_type' && (first as z.ZodInvalidTypeIssue).received === 'undefined') {
      return `Field ${index + 1} is missing a required '${String(field)}' value`
    }
    return `Field ${index + 1}: '${String(field)}' ${first.message}`
  }
  if (typeof index === 'number') {
    return `Field ${index + 1}: ${first.message}`
  }
  return first.message
}

export function exportSchemaToFile(schema: FormSchema): void {
  const json = JSON.stringify(schema, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'form-schema.json'
  a.click()
  URL.revokeObjectURL(url)
}
