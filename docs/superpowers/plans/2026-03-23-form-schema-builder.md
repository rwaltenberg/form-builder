# Form Schema Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + TypeScript SPA that lets non-technical Client Admins define custom data-entry forms via a drag-and-drop schema builder with a live preview, JSON output, and import/export.

**Architecture:** A single `useFormSchema` hook owns all state and exposes typed actions. `SchemaBuilder` (left/builder tab) and `LivePreview` (right/preview tab) are pure derivations of that state. Utilities (`slugify`, `importExport`, `zodSchemaBuilder`) are pure functions with no side effects, making them easy to test in isolation.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui, dnd-kit, react-hook-form, zod, uuid, lucide-react, Sonner, Vitest + React Testing Library

---

## File Map

| File | Responsibility |
|---|---|
| `src/types.ts` | `FieldSchema`, `FormSchema`, `DataType` types |
| `src/utils/slugify.ts` | Pure key transform function |
| `src/utils/zodSchemaBuilder.ts` | Converts `FormSchema` → zod object for preview validation |
| `src/utils/importExport.ts` | Zod import schema + export download logic |
| `src/hooks/useFormSchema.ts` | All schema state + typed actions |
| `src/components/SchemaBuilder/index.tsx` | Header (title, Import/Export), composes FieldList + AddFieldButton |
| `src/components/SchemaBuilder/FieldList.tsx` | dnd-kit SortableContext + empty state |
| `src/components/SchemaBuilder/FieldRow.tsx` | Collapsed row: summary, expand toggle, delete button |
| `src/components/SchemaBuilder/FieldEditor.tsx` | Expanded inline config: key, label, type, required, enums, validation |
| `src/components/LivePreview/index.tsx` | Layout wrapper + empty state |
| `src/components/LivePreview/PreviewForm.tsx` | react-hook-form setup, renders PreviewFields + SubmitButton + JsonOutputPanel |
| `src/components/LivePreview/PreviewField.tsx` | Renders correct input per field type |
| `src/components/LivePreview/JsonOutputPanel.tsx` | Formatted JSON output card |
| `src/App.tsx` | Responsive layout shell (side-by-side desktop / tabs mobile) |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx` (stub)

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```bash
cd /home/rwaltenberg/development/sardine
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-hook-form @hookform/resolvers zod uuid sonner lucide-react
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/uuid
```

- [ ] **Step 3: Install and configure Tailwind CSS**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Replace contents of `src/index.css` with:
```css
@import "tailwindcss";
```

In `vite.config.ts`, add the Tailwind plugin:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Configure Vitest setup file**

Create `src/test-setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Install shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted, accept defaults (New York style, zinc color, CSS variables: yes).

- [ ] **Step 6: Add required shadcn components**

```bash
npx shadcn@latest add button input label select switch card tabs badge separator sonner
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at `http://localhost:5173` with the default Vite + React page.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + React + TS + Tailwind + shadcn + dnd-kit"
```

---

## Task 2: Types

**Files:**
- Create: `src/types.ts`
- Test: `src/utils/__tests__/types.test.ts` (type-level only, no runtime test needed — types are verified by TypeScript compiler)

- [ ] **Step 1: Create `src/types.ts`**

```ts
export type DataType = 'string' | 'number' | 'boolean' | 'enum';

export interface ValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FieldSchema {
  id: string;
  key: string;
  label: string;
  type: DataType;
  required: boolean;
  enumOptions?: string[];
  validation?: ValidationRules;
}

export type FormSchema = FieldSchema[];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add core TypeScript types"
```

---

## Task 3: `slugify` Utility

**Files:**
- Create: `src/utils/slugify.ts`
- Test: `src/utils/__tests__/slugify.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/__tests__/slugify.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/__tests__/slugify.test.ts
```

Expected: FAIL — `slugify` not found.

- [ ] **Step 3: Implement `src/utils/slugify.ts`**

```ts
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ /g, '_')
    .replace(/[^a-z0-9_]/g, '')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/__tests__/slugify.test.ts
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/slugify.ts src/utils/__tests__/slugify.test.ts
git commit -m "feat: add slugify utility"
```

---

## Task 4: `zodSchemaBuilder` Utility

**Files:**
- Create: `src/utils/zodSchemaBuilder.ts`
- Test: `src/utils/__tests__/zodSchemaBuilder.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/__tests__/zodSchemaBuilder.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/__tests__/zodSchemaBuilder.test.ts
```

Expected: FAIL — `buildZodSchema` not found.

- [ ] **Step 3: Implement `src/utils/zodSchemaBuilder.ts`**

```ts
import { z } from 'zod'
import type { FormSchema } from '../types'

export function buildZodSchema(fields: FormSchema): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {}

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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/__tests__/zodSchemaBuilder.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/zodSchemaBuilder.ts src/utils/__tests__/zodSchemaBuilder.test.ts
git commit -m "feat: add zodSchemaBuilder utility"
```

---

## Task 5: `importExport` Utility

**Files:**
- Create: `src/utils/importExport.ts`
- Test: `src/utils/__tests__/importExport.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/__tests__/importExport.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { parseImportedSchema, formatImportError } from '../importExport'
import type { FieldSchema } from '../../types'

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
    if (result.success) expect((result.data[0] as Record<string, unknown>).unknownField).toBeUndefined()
  })
})

describe('formatImportError', () => {
  it('formats a missing field error', () => {
    const issues = [{ path: [1, 'type'], message: 'Required' }]
    const msg = formatImportError(issues as Parameters<typeof formatImportError>[0])
    expect(msg).toContain('Field 2')
    expect(msg).toContain('type')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/__tests__/importExport.test.ts
```

Expected: FAIL — functions not found.

- [ ] **Step 3: Implement `src/utils/importExport.ts`**

```ts
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
    // Distinguish between missing required fields and invalid values
    if (first.code === 'invalid_type' && first.received === 'undefined') {
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/__tests__/importExport.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/importExport.ts src/utils/__tests__/importExport.test.ts
git commit -m "feat: add importExport utility"
```

---

## Task 6: `useFormSchema` Hook

**Files:**
- Create: `src/hooks/useFormSchema.ts`
- Test: `src/hooks/__tests__/useFormSchema.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useFormSchema.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks/__tests__/useFormSchema.test.ts
```

Expected: FAIL — hook not found.

- [ ] **Step 3: Implement `src/hooks/useFormSchema.ts`**

```ts
import { useState, useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { v4 as uuidv4 } from 'uuid'
import type { FieldSchema, FormSchema } from '../types'

interface UseFormSchemaReturn {
  schema: FormSchema
  expandedFieldId: string | null
  addField: () => void
  updateField: (id: string, partial: Partial<FieldSchema>) => void
  removeField: (id: string) => void
  reorderFields: (activeId: string, overId: string | null) => void
  setExpandedFieldId: (id: string | null) => void
  importSchema: (fields: FormSchema) => void
}

export function useFormSchema(): UseFormSchemaReturn {
  const [schema, setSchema] = useState<FormSchema>([])
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null)

  const addField = useCallback(() => {
    const newField: FieldSchema = {
      id: uuidv4(),
      key: '',
      label: '',
      type: 'string',
      required: false,
    }
    setSchema(prev => [...prev, newField])
    setExpandedFieldId(newField.id)
  }, [])

  const updateField = useCallback((id: string, partial: Partial<FieldSchema>) => {
    setSchema(prev =>
      prev.map(field => field.id === id ? { ...field, ...partial } : field)
    )
  }, [])

  const removeField = useCallback((id: string) => {
    setSchema(prev => prev.filter(field => field.id !== id))
    setExpandedFieldId(prev => prev === id ? null : prev)
  }, [])

  const reorderFields = useCallback((activeId: string, overId: string | null) => {
    if (!overId) return
    setSchema(prev => {
      const oldIndex = prev.findIndex(f => f.id === activeId)
      const newIndex = prev.findIndex(f => f.id === overId)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const importSchema = useCallback((fields: FormSchema) => {
    setSchema(fields)
    setExpandedFieldId(null)
  }, [])

  return {
    schema,
    expandedFieldId,
    addField,
    updateField,
    removeField,
    reorderFields,
    setExpandedFieldId,
    importSchema,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/hooks/__tests__/useFormSchema.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFormSchema.ts src/hooks/__tests__/useFormSchema.test.ts
git commit -m "feat: add useFormSchema hook"
```

---

## Task 7: `App` Layout Shell

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx` with the responsive layout shell**

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from 'sonner'
import { SchemaBuilder } from './components/SchemaBuilder'
import { LivePreview } from './components/LivePreview'
import { useFormSchema } from './hooks/useFormSchema'

export default function App() {
  const formSchemaState = useFormSchema()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />

      {/* Desktop: side-by-side */}
      <div className="hidden md:grid md:grid-cols-2 md:h-screen">
        <div className="border-r overflow-y-auto p-6">
          <SchemaBuilder {...formSchemaState} />
        </div>
        <div className="overflow-y-auto p-6">
          <LivePreview schema={formSchemaState.schema} />
        </div>
      </div>

      {/* Mobile: tabbed */}
      <div className="md:hidden p-4">
        <Tabs defaultValue="builder">
          <TabsList className="w-full">
            <TabsTrigger value="builder" className="flex-1">Builder</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="builder" className="mt-4">
            <SchemaBuilder {...formSchemaState} />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <LivePreview schema={formSchemaState.schema} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles (stubs for missing components will be created in subsequent tasks)**

This step will produce errors until `SchemaBuilder` and `LivePreview` are created. Create stubs now:

Create `src/components/SchemaBuilder/index.tsx`:
```tsx
export function SchemaBuilder() {
  return <div>SchemaBuilder</div>
}
```

Create `src/components/LivePreview/index.tsx`:
```tsx
export function LivePreview() {
  return <div>LivePreview</div>
}
```

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/components/SchemaBuilder/index.tsx src/components/LivePreview/index.tsx
git commit -m "feat: add App layout shell with responsive tabs"
```

---

## Task 8: `FieldEditor` Component

**Files:**
- Create: `src/components/SchemaBuilder/FieldEditor.tsx`
- Test: `src/components/SchemaBuilder/__tests__/FieldEditor.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/SchemaBuilder/__tests__/FieldEditor.test.tsx`:
```tsx
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
    // Simulate type change via the Select (shadcn Select uses a hidden input + role=combobox)
    const trigger = screen.getByRole('combobox')
    await userEvent.click(trigger)
    const boolOption = await screen.findByRole('option', { name: /boolean/i })
    await userEvent.click(boolOption)
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ type: 'boolean', validation: undefined, enumOptions: undefined }))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/SchemaBuilder/__tests__/FieldEditor.test.tsx
```

Expected: FAIL — component not found.

- [ ] **Step 3: Implement `src/components/SchemaBuilder/FieldEditor.tsx`**

```tsx
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import { slugify } from '../../utils/slugify'
import type { FieldSchema, DataType } from '../../types'

interface FieldEditorProps {
  field: FieldSchema
  allKeys: string[]
  onUpdate: (partial: Partial<FieldSchema>) => void
}

export function FieldEditor({ field, allKeys, onUpdate }: FieldEditorProps) {
  const [keyError, setKeyError] = useState<string | null>(null)
  const [enumInput, setEnumInput] = useState('')
  const [enumError, setEnumError] = useState<string | null>(null)

  function handleKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
    onUpdate({ key: slugify(e.target.value) })
  }

  function handleKeyBlur() {
    if (!field.key) {
      setKeyError('Key is required')
    } else if (allKeys.includes(field.key)) {
      setKeyError('Duplicate key — must be unique')
    } else {
      setKeyError(null)
    }
  }

  function handleTypeChange(value: DataType) {
    onUpdate({ type: value, validation: undefined, enumOptions: undefined })
  }

  function handleAddEnumOption() {
    const trimmed = enumInput.trim()
    if (!trimmed) return
    const options = field.enumOptions ?? []
    if (options.includes(trimmed)) {
      setEnumError('Duplicate option')
      return
    }
    setEnumError(null)
    onUpdate({ enumOptions: [...options, trimmed] })
    setEnumInput('')
  }

  function handleRemoveEnumOption(opt: string) {
    onUpdate({ enumOptions: (field.enumOptions ?? []).filter(o => o !== opt) })
  }

  const minMaxWarning =
    field.validation?.min !== undefined &&
    field.validation?.max !== undefined &&
    field.validation.min > field.validation.max
      ? 'Min must be ≤ Max'
      : null

  return (
    <div className="space-y-4 p-4 border-t">
      {/* Key */}
      <div className="space-y-1">
        <Label htmlFor={`key-${field.id}`}>Key</Label>
        <Input
          id={`key-${field.id}`}
          value={field.key}
          onChange={handleKeyChange}
          onBlur={handleKeyBlur}
          maxLength={64}
          placeholder="e.g. employee_id"
        />
        {keyError && <p className="text-sm text-destructive">{keyError}</p>}
      </div>

      {/* Label */}
      <div className="space-y-1">
        <Label htmlFor={`label-${field.id}`}>Label</Label>
        <Input
          id={`label-${field.id}`}
          value={field.label}
          onChange={e => onUpdate({ label: e.target.value })}
          maxLength={128}
          placeholder="e.g. Employee ID"
        />
      </div>

      {/* Type */}
      <div className="space-y-1">
        <Label>Type</Label>
        <Select value={field.type} onValueChange={(v) => handleTypeChange(v as DataType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="enum">Enum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Required */}
      <div className="flex items-center gap-2">
        <Switch
          id={`required-${field.id}`}
          checked={field.required}
          onCheckedChange={checked => onUpdate({ required: checked })}
        />
        <Label htmlFor={`required-${field.id}`}>Required</Label>
      </div>

      {/* Enum options */}
      {field.type === 'enum' && (
        <div className="space-y-2">
          <Label>Options</Label>
          <div className="flex flex-wrap gap-1">
            {(field.enumOptions ?? []).map(opt => (
              <Badge key={opt} variant="secondary" className="gap-1">
                {opt}
                <button onClick={() => handleRemoveEnumOption(opt)} aria-label={`Remove ${opt}`}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={enumInput}
              onChange={e => setEnumInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddEnumOption() } }}
              maxLength={64}
              placeholder="Add option..."
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddEnumOption}>Add</Button>
          </div>
          {enumError && <p className="text-sm text-destructive">{enumError}</p>}
        </div>
      )}

      {/* String validation */}
      {field.type === 'string' && (
        <div className="space-y-2">
          <Label>Validation</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`min-${field.id}`} className="text-xs">Min Length</Label>
              <Input
                id={`min-${field.id}`}
                type="number"
                value={field.validation?.min ?? ''}
                onChange={e => onUpdate({ validation: { ...field.validation, min: e.target.value ? Number(e.target.value) : undefined } })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`max-${field.id}`} className="text-xs">Max Length</Label>
              <Input
                id={`max-${field.id}`}
                type="number"
                value={field.validation?.max ?? ''}
                onChange={e => onUpdate({ validation: { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined } })}
              />
            </div>
          </div>
          {minMaxWarning && <p className="text-sm text-amber-600">{minMaxWarning}</p>}
          <div className="space-y-1">
            <Label htmlFor={`pattern-${field.id}`}>Pattern (regex)</Label>
            <Input
              id={`pattern-${field.id}`}
              value={field.validation?.pattern ?? ''}
              onChange={e => onUpdate({ validation: { ...field.validation, pattern: e.target.value || undefined } })}
              placeholder="e.g. ^[A-Z]+$"
            />
          </div>
        </div>
      )}

      {/* Number validation */}
      {field.type === 'number' && (
        <div className="space-y-2">
          <Label>Validation</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`min-${field.id}`} className="text-xs">Min Value</Label>
              <Input
                id={`min-${field.id}`}
                type="number"
                value={field.validation?.min ?? ''}
                onChange={e => onUpdate({ validation: { ...field.validation, min: e.target.value ? Number(e.target.value) : undefined } })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`max-${field.id}`} className="text-xs">Max Value</Label>
              <Input
                id={`max-${field.id}`}
                type="number"
                value={field.validation?.max ?? ''}
                onChange={e => onUpdate({ validation: { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined } })}
              />
            </div>
          </div>
          {minMaxWarning && <p className="text-sm text-amber-600">{minMaxWarning}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/SchemaBuilder/__tests__/FieldEditor.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SchemaBuilder/FieldEditor.tsx src/components/SchemaBuilder/__tests__/FieldEditor.test.tsx
git commit -m "feat: add FieldEditor component"
```

---

## Task 9: `FieldRow` and `FieldList` Components

**Files:**
- Create: `src/components/SchemaBuilder/FieldRow.tsx`
- Create: `src/components/SchemaBuilder/FieldList.tsx`
- Test: `src/components/SchemaBuilder/__tests__/FieldRow.test.tsx`

- [ ] **Step 1: Write failing tests for FieldRow**

Create `src/components/SchemaBuilder/__tests__/FieldRow.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/SchemaBuilder/__tests__/FieldRow.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/components/SchemaBuilder/FieldRow.tsx`**

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FieldEditor } from './FieldEditor'
import type { FieldSchema } from '../../types'

interface FieldRowProps {
  field: FieldSchema
  isExpanded: boolean
  allKeys: string[]
  onExpand: (id: string) => void
  onUpdate: (partial: Partial<FieldSchema>) => void
  onRemove: (id: string) => void
}

const TYPE_LABELS: Record<string, string> = {
  string: 'String', number: 'Number', boolean: 'Boolean', enum: 'Enum',
}

export function FieldRow({ field, isExpanded, allKeys, onExpand, onUpdate, onRemove }: FieldRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const displayName = field.label || field.key || undefined

  return (
    <div ref={setNodeRef} style={style} className="border rounded-md bg-card">
      {/* Collapsed header */}
      <div className="flex items-center gap-2 p-3">
        <button
          className="cursor-grab text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          className="flex-1 flex items-center gap-2 text-left"
          onClick={() => onExpand(field.id)}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <span className={displayName ? '' : 'text-muted-foreground italic'}>
            {displayName ?? 'Untitled field'}
          </span>
          <Badge variant="outline" className="ml-auto">{TYPE_LABELS[field.type]}</Badge>
          {field.required && <Badge variant="secondary">Required</Badge>}
        </button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete field"
          onClick={() => onRemove(field.id)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded editor */}
      {isExpanded && (
        <FieldEditor
          field={field}
          allKeys={allKeys}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Implement `src/components/SchemaBuilder/FieldList.tsx`**

```tsx
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LayoutList } from 'lucide-react'
import { FieldRow } from './FieldRow'
import type { FieldSchema, FormSchema } from '../../types'

interface FieldListProps {
  schema: FormSchema
  expandedFieldId: string | null
  onExpand: (id: string) => void
  onUpdate: (id: string, partial: Partial<FieldSchema>) => void
  onRemove: (id: string) => void
  onReorder: (activeId: string, overId: string | null) => void
}

export function FieldList({ schema, expandedFieldId, onExpand, onUpdate, onRemove, onReorder }: FieldListProps) {
  const sensors = useSensors(useSensor(PointerSensor))
  const allKeys = schema.map(f => f.key)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    onReorder(String(active.id), over ? String(over.id) : null)
  }

  if (schema.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
        <LayoutList className="h-10 w-10" />
        <p className="font-medium">No fields yet</p>
        <p className="text-sm">Click "Add Field" below to get started</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={schema.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {schema.map(field => (
            <FieldRow
              key={field.id}
              field={field}
              isExpanded={expandedFieldId === field.id}
              allKeys={allKeys.filter(k => k !== field.key)}
              onExpand={onExpand}
              onUpdate={partial => onUpdate(field.id, partial)}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
```

- [ ] **Step 5: Run FieldRow tests to verify they pass**

```bash
npx vitest run src/components/SchemaBuilder/__tests__/FieldRow.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/SchemaBuilder/FieldRow.tsx src/components/SchemaBuilder/FieldList.tsx src/components/SchemaBuilder/__tests__/FieldRow.test.tsx
git commit -m "feat: add FieldRow and FieldList components"
```

---

## Task 10: `SchemaBuilder` Component

**Files:**
- Modify: `src/components/SchemaBuilder/index.tsx`
- Create: `src/components/SchemaBuilder/AddFieldButton.tsx`

- [ ] **Step 1: Create `src/components/SchemaBuilder/AddFieldButton.tsx`**

```tsx
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddFieldButtonProps {
  onClick: () => void
}

export function AddFieldButton({ onClick }: AddFieldButtonProps) {
  return (
    <Button onClick={onClick} variant="outline" className="w-full gap-2">
      <Plus className="h-4 w-4" />
      Add Field
    </Button>
  )
}
```

- [ ] **Step 2: Replace `src/components/SchemaBuilder/index.tsx` with full implementation**

```tsx
import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FieldList } from './FieldList'
import { AddFieldButton } from './AddFieldButton'
import { parseImportedSchema, exportSchemaToFile, formatImportError } from '../../utils/importExport'
import type { FieldSchema, FormSchema } from '../../types'

interface SchemaBuilderProps {
  schema: FormSchema
  expandedFieldId: string | null
  addField: () => void
  updateField: (id: string, partial: Partial<FieldSchema>) => void
  removeField: (id: string) => void
  reorderFields: (activeId: string, overId: string | null) => void
  setExpandedFieldId: (id: string | null) => void
  importSchema: (fields: FormSchema) => void
}

export function SchemaBuilder({
  schema,
  expandedFieldId,
  addField,
  updateField,
  removeField,
  reorderFields,
  setExpandedFieldId,
  importSchema,
}: SchemaBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    exportSchemaToFile(schema)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        const result = parseImportedSchema(parsed)
        if (result.success) {
          importSchema(result.data)
          toast.success(`Schema imported — ${result.data.length} fields loaded.`)
        } else {
          toast.error(`Import failed: ${formatImportError(result.issues)}`)
        }
      } catch {
        toast.error('Import failed: File is not valid JSON.')
      }
    }
    reader.readAsText(file)
  }

  function handleExpand(id: string) {
    setExpandedFieldId(expandedFieldId === id ? null : id)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Form Builder</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-1">
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1" disabled={schema.length === 0}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <FieldList
        schema={schema}
        expandedFieldId={expandedFieldId}
        onExpand={handleExpand}
        onUpdate={updateField}
        onRemove={removeField}
        onReorder={reorderFields}
      />

      <AddFieldButton onClick={addField} />
    </div>
  )
}
```

- [ ] **Step 3: Verify the app builds**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SchemaBuilder/
git commit -m "feat: complete SchemaBuilder with import/export"
```

---

## Task 11: `PreviewField` and `JsonOutputPanel` Components

**Files:**
- Create: `src/components/LivePreview/PreviewField.tsx`
- Create: `src/components/LivePreview/JsonOutputPanel.tsx`
- Test: `src/components/LivePreview/__tests__/PreviewField.test.tsx`

- [ ] **Step 1: Write failing tests for PreviewField**

Create `src/components/LivePreview/__tests__/PreviewField.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/LivePreview/__tests__/PreviewField.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/components/LivePreview/PreviewField.tsx`**

```tsx
import { useFormContext, Controller } from 'react-hook-form'
import type { FieldError } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FieldSchema } from '../../types'

interface PreviewFieldProps {
  field: FieldSchema
  error: FieldError | undefined
}

export function PreviewField({ field, error }: PreviewFieldProps) {
  const { register, control } = useFormContext()

  return (
    <div className="space-y-1">
      <Label htmlFor={`preview-${field.key}`}>
        {field.label || field.key || 'Untitled field'}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {field.type === 'string' && (
        <Input id={`preview-${field.key}`} {...register(field.key)} />
      )}

      {field.type === 'number' && (
        <Input id={`preview-${field.key}`} type="number" {...register(field.key)} />
      )}

      {field.type === 'boolean' && (
        <Controller
          name={field.key}
          control={control}
          defaultValue={false}
          render={({ field: f }) => (
            <Switch
              id={`preview-${field.key}`}
              checked={!!f.value}
              onCheckedChange={f.onChange}
            />
          )}
        />
      )}

      {field.type === 'enum' && (
        <Controller
          name={field.key}
          control={control}
          render={({ field: f }) => {
            const options = field.enumOptions ?? []
            const hasOptions = options.length > 0
            return (
              <Select
                value={f.value ?? ''}
                onValueChange={f.onChange}
                disabled={!hasOptions}
              >
                <SelectTrigger id={`preview-${field.key}`}>
                  <SelectValue placeholder={hasOptions ? 'Select...' : 'No options defined'} />
                </SelectTrigger>
                <SelectContent>
                  {options.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }}
        />
      )}

      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Implement `src/components/LivePreview/JsonOutputPanel.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface JsonOutputPanelProps {
  data: Record<string, unknown>
}

export function JsonOutputPanel({ data }: JsonOutputPanelProps) {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">JSON Output</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted rounded p-3 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Run PreviewField tests to verify they pass**

```bash
npx vitest run src/components/LivePreview/__tests__/PreviewField.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/LivePreview/PreviewField.tsx src/components/LivePreview/JsonOutputPanel.tsx src/components/LivePreview/__tests__/PreviewField.test.tsx
git commit -m "feat: add PreviewField and JsonOutputPanel components"
```

---

## Task 12: `PreviewForm` and `LivePreview` Components

**Files:**
- Create: `src/components/LivePreview/PreviewForm.tsx`
- Modify: `src/components/LivePreview/index.tsx`

- [ ] **Step 1: Implement `src/components/LivePreview/PreviewForm.tsx`**

```tsx
import { useEffect, useState, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { PreviewField } from './PreviewField'
import { JsonOutputPanel } from './JsonOutputPanel'
import { buildZodSchema } from '../../utils/zodSchemaBuilder'
import type { FormSchema } from '../../types'

interface PreviewFormProps {
  schema: FormSchema
}

export function PreviewForm({ schema }: PreviewFormProps) {
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null)

  // Track keys+types to detect structural changes that require a reset
  const structureKey = schema.map(f => `${f.key}:${f.type}`).join('|')
  const prevStructureKey = useRef(structureKey)

  const zodSchema = buildZodSchema(schema)
  const methods = useForm({
    resolver: zodResolver(zodSchema),
  })

  useEffect(() => {
    if (prevStructureKey.current !== structureKey) {
      methods.reset()
      setSubmittedData(null)
      prevStructureKey.current = structureKey
    }
  }, [structureKey, methods])

  function onSubmit(data: Record<string, unknown>) {
    setSubmittedData(data)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        {schema.map(field => (
          <PreviewField
            key={field.id}
            field={field}
            error={methods.formState.errors[field.key] as import('react-hook-form').FieldError | undefined}
          />
        ))}

        <Button type="submit" className="w-full">Submit</Button>
      </form>

      {submittedData && <JsonOutputPanel data={submittedData} />}
    </FormProvider>
  )
}
```

- [ ] **Step 2: Replace `src/components/LivePreview/index.tsx` with full implementation**

```tsx
import { FileQuestion } from 'lucide-react'
import { PreviewForm } from './PreviewForm'
import type { FormSchema } from '../../types'

interface LivePreviewProps {
  schema: FormSchema
}

export function LivePreview({ schema }: LivePreviewProps) {
  if (schema.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Live Preview</h2>
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <FileQuestion className="h-10 w-10" />
          <p className="text-sm">Add fields in the builder to see a preview.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Live Preview</h2>
      <PreviewForm schema={schema} />
    </div>
  )
}
```

- [ ] **Step 3: Verify the full app builds**

```bash
npm run build
```

Expected: no type errors.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 5: Smoke test in the browser**

```bash
npm run dev
```

Manually verify:
- [ ] Adding a field shows it in the builder and live preview
- [ ] Filling out the live preview form and submitting shows JSON output
- [ ] Drag-and-drop reordering works
- [ ] Import/export roundtrip works (export, then re-import the file)
- [ ] Mobile tabs work (resize browser to <768px)

- [ ] **Step 6: Commit**

```bash
git add src/components/LivePreview/
git commit -m "feat: complete LivePreview with PreviewForm and JsonOutputPanel"
```

---

## Task 13: Final Polish and Cleanup

**Files:**
- Modify: `src/App.tsx` (page title)
- Modify: `index.html` (document title)

- [ ] **Step 1: Update document title in `index.html`**

```html
<title>Form Schema Builder</title>
```

- [ ] **Step 2: Run full test suite one last time**

```bash
npx vitest run
```

Expected: all tests PASS, no errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: form schema builder prototype complete"
```
