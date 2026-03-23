import { z } from 'zod'
import type { FormSchema } from '../types'

export function buildZodSchema(fields: FormSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny

    switch (field.type) {
      case 'string': {
        let s = z.string()
        const v = field.validation
        if (v?.min !== undefined) s = s.min(v.min)
        if (v?.max !== undefined) s = s.max(v.max)
        if (v?.pattern) {
          try {
            s = s.regex(new RegExp(v.pattern))
          } catch {
            // invalid regex — silently skip
          }
        }
        fieldSchema = field.required ? s.min(1) : s
        break
      }
      case 'number': {
        let n = z.coerce.number()
        const v = field.validation
        if (v?.min !== undefined) n = n.min(v.min)
        if (v?.max !== undefined) n = n.max(v.max)
        fieldSchema = field.required ? n : n.optional()
        break
      }
      case 'boolean':
        fieldSchema = z.boolean()
        break
      case 'enum': {
        const options = field.enumOptions ?? []
        if (options.length >= 1) {
          fieldSchema = z.enum(options as [string, ...string[]])
        } else {
          fieldSchema = z.string()
        }
        if (!field.required) fieldSchema = fieldSchema.optional()
        break
      }
    }

    shape[field.key] = fieldSchema!
  }

  return z.object(shape)
}
