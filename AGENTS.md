# AGENTS.md — Form Schema Builder

A browser-based React SPA that lets non-technical admins build custom data-entry forms visually and export the resulting JSON schema.

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 19 + TypeScript, Vite 8 |
| Styles | Tailwind CSS v4 (no `tailwind.config.*`; config via CSS + Vite plugin) |
| UI components | shadcn/ui via Base UI (`@base-ui/react`), style `base-nova` |
| Drag-and-drop | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) |
| Preview form | react-hook-form + `@hookform/resolvers/zod` |
| Validation | Zod v4 |
| Icons | lucide-react |
| IDs | uuid |
| Toasts | Sonner |
| Unit tests | Vitest + React Testing Library (`npx vitest`) |
| E2E tests | Playwright (`npm run test:e2e`) |

No backend — fully client-side. No Prettier config.

---

## Project Structure

```
src/
├── components/
│   ├── SchemaBuilder/
│   │   ├── index.tsx          # header (title, Import/Export), FieldList, AddFieldButton
│   │   ├── FieldList.tsx      # dnd-kit SortableContext + empty state
│   │   ├── FieldRow.tsx       # collapsed row + FieldEditor toggle + delete button
│   │   └── FieldEditor.tsx    # expanded inline config panel
│   ├── LivePreview/
│   │   ├── index.tsx          # layout wrapper + empty state
│   │   ├── PreviewForm.tsx    # react-hook-form setup, PreviewField(s), submit, JsonOutputPanel
│   │   ├── PreviewField.tsx   # renders correct input per field type
│   │   └── JsonOutputPanel.tsx
│   └── ui/                    # shadcn primitives (button, input, select, tabs, card, etc.)
├── hooks/
│   └── useFormSchema.ts       # single source of truth — fields CRUD + reordering
├── utils/
│   ├── slugify.ts             # key transform: lowercase, spaces→underscores, strip non-alphanumeric
│   ├── importExport.ts        # zod import validation schema + export download
│   └── zodSchemaBuilder.ts    # FormSchema → zod object for preview validation
├── types.ts                   # DataType, FieldSchema, FormSchema
├── App.tsx                    # responsive layout shell (desktop split / mobile tabs)
└── index.css                  # Tailwind + shadcn tokens + Geist font
e2e/
├── builder.spec.ts
└── preview.spec.ts
docs/superpowers/
├── specs/2026-03-23-form-schema-builder-design.md   # authoritative design spec
└── plans/2026-03-23-form-schema-builder.md          # implementation plan with task checklist
```

**Path alias:** `@/*` resolves to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

---

## Core Data Model

```ts
type DataType = 'string' | 'number' | 'boolean' | 'enum';

interface FieldSchema {
  id: string;             // uuid — for DnD/React keys only, never in form submission values
  key: string;            // machine key (e.g. "employee_id"); auto-slugified
  label: string;          // display label
  type: DataType;
  required: boolean;
  enumOptions?: string[]; // only when type === 'enum'
  validation?: {
    min?: number;         // string: min length / number: min value
    max?: number;         // string: max length / number: max value
    pattern?: string;     // string only
  };                      // always undefined for boolean/enum types
}

type FormSchema = FieldSchema[];
```

`min`/`max` serve dual roles: character length bounds for `string`, numeric bounds for `number`.

---

## Architecture & Key Conventions

### State

`useFormSchema` (in `src/hooks/useFormSchema.ts`) is the **only** place that mutates the schema. Exposed actions:
- `addField()` — appends default field, sets it as expanded
- `updateField(id, partial)` — merges updates by id
- `removeField(id)`
- `reorderFields(activeId, overId)` — uses `arrayMove` from dnd-kit; no-op if `overId` is null
- `importSchema(fields)` — replaces state after zod validation
- `exportSchema()` — triggers browser file download as `form-schema.json`

### Layout

- **Desktop (≥768px):** two equal columns — `SchemaBuilder` | `LivePreview`
- **Mobile (<768px):** shadcn `Tabs` toggling between the same components

### Advisory Errors

Validation issues shown in the builder UI (inline messages) that **never block** saving, collapsing, or exporting. They are never included in exports. Two advisory cases:
1. Empty or duplicate field `key` (checked on blur)
2. `min > max` when both are set

### Type-switch Behavior

When a field's `type` changes, `validation` and `enumOptions` are immediately cleared to prevent stale data.

### Live Preview Sync

- `reset()` is called (and `JsonOutputPanel` hidden) only when the schema **structure** changes: field added/removed, or a field's `key` or `type` changes.
- Label, `required`, `enumOptions`, `min`, `max`, `pattern` changes propagate without `reset()` — already-entered values are preserved.

### Key Auto-slugify

On every keystroke in the key input: lowercase, spaces → underscores, strip non-alphanumeric/underscore characters.

---

## Development Commands

```bash
npm run dev           # start dev server (http://localhost:5173)
npm run build         # type-check + production build → dist/
npm run lint          # ESLint
npm run test:unit     # run Vitest unit tests
npm run test:unit:ui  # Vitest browser UI
npm run test:e2e      # Playwright E2E (requires dev server)
npm run test:e2e:ui   # Playwright UI
```

---

## Out of Scope (prototype)

Backend persistence, authentication, conditional field logic, multi-step forms, custom styling of generated forms, and blocking export on invalid schema state are all explicitly out of scope. Do not add them unless the spec is updated.
