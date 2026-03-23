# Form Schema Builder — Design Spec
_Date: 2026-03-23_

## Overview

A prototype Client Form Schema Builder — a tool allowing non-technical Client Admins to define custom data-entry forms for their employees. The builder produces a JSON schema that drives a "Form Engine" capable of triggering actions in the enterprise system.

---

## Terminology

**Advisory error:** A validation issue shown in the UI (inline message or warning) that informs the admin of a problem but does not block any action (saving, collapsing, exporting). Advisory errors are never included in exports or communicated to the Form Engine — they exist only to guide the admin in the builder UI.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React + TypeScript (Vite SPA) |
| Styling | Tailwind CSS + shadcn/ui |
| Drag-and-drop | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) |
| Preview form state | react-hook-form |
| Validation | zod |
| Icons | lucide-react (bundled with shadcn) |
| ID generation | uuid |
| Toasts | Sonner (shadcn) |

No external UI component library beyond shadcn/ui. No backend — fully client-side.

---

## Data Model

The `FormSchema` array is the single source of truth for the entire application. All UI is a pure derivation of this state.

```ts
type DataType = 'string' | 'number' | 'boolean' | 'enum';

interface FieldSchema {
  id: string;           // internal uuid for DnD/React keys — always generated client-side
  key: string;          // unique machine key, e.g. "employee_id"
  label: string;        // display label, e.g. "Employee ID"
  type: DataType;
  required: boolean;    // always present; defaults to false
  enumOptions?: string[];   // only when type === 'enum'; always undefined for other types
  validation?: {
    min?: number;            // string: min length / number: min value
    max?: number;            // string: max length / number: max value
    pattern?: string;        // string only: regex pattern
  };                         // always undefined for boolean and enum types
}

type FormSchema = FieldSchema[];
```

The `min`/`max` fields serve dual roles depending on `type`: for `string` fields they represent character length bounds; for `number` fields they represent numeric value bounds. The UI labels ("Min Length" / "Max Length" vs. "Min Value" / "Max Value") reflect this distinction, but the underlying field name is the same in both cases.

### New Field Defaults

When `addField()` is called, the new field is initialized with:
```ts
{
  id: uuid(),
  key: '',
  label: '',
  type: 'string',
  required: false,
  enumOptions: undefined,
  validation: undefined,
}
```
The field is immediately expanded in the editor so the admin can fill in its details.

---

## Architecture

### State Layer

A single custom hook `useFormSchema` owns the `FormSchema` array and exposes typed actions:

- `addField()` — appends a new field with defaults (see above) and sets it as the expanded field
- `updateField(id, partial)` — merges updates into a field by id
- `removeField(id)` — removes a field by id
- `reorderFields(activeId, overId)` — accepts dnd-kit item IDs; if `overId` is `null` (item dropped outside a valid drop target), the reorder is a no-op. Otherwise, resolves IDs to indices internally using `arrayMove` from `@dnd-kit/sortable`
- `importSchema(fields)` — replaces state after validation
- `exportSchema()` — triggers JSON file download

Nothing outside this hook mutates the schema directly.

### Layout

Responsive shell in `App`:

- **Desktop (≥768px):** two equal columns — `SchemaBuilder` on the left, `LivePreview` on the right, both always visible.
- **Mobile (<768px):** shadcn `Tabs` component with "Builder" and "Preview" tabs switching between the same components.

### Component Tree

```
App
├── SchemaBuilder                  ← includes inline header with title + Import/Export buttons
│   ├── FieldList                  ← dnd-kit SortableContext; shows empty state when no fields
│   │   └── FieldRow (×n)          ← drag handle + field summary + expand toggle + delete button
│   │       └── FieldEditor        ← inline expanded config panel
│   └── AddFieldButton
└── LivePreview
    ├── PreviewForm                ← react-hook-form setup; renders PreviewFields, SubmitButton (inlined), and JsonOutputPanel
    │   └── PreviewField (×n)      ← renders Input/Switch/Select per type
    └── JsonOutputPanel            ← shown after submit, hidden when schema structure changes
```

---

## Key Behaviors

### Builder

**Drag-and-drop reordering:** `dnd-kit` `SortableContext` wraps `FieldList`. Each `FieldRow` has a drag handle (grip icon). `onDragEnd` passes `activeId` and `overId` directly to `reorderFields`. Reordering does not reset the live preview form.

**Inline field expansion:** Only one field can be expanded at a time. Expanding a new field collapses any open one. Collapse is allowed at any time — advisory errors do not block collapse or export.

**The expanded `FieldEditor` shows:**
- Key (text input, auto-slugified; max 64 characters)
- Label (text input; max 128 characters)
- Type (shadcn `Select`: String / Number / Boolean / Enum)
- Required (shadcn `Switch`)
- Enum options input — only visible when `type === 'enum'`
- Validation fields — only visible when `type === 'string'` or `type === 'number'`

**Switching field type:** When the type changes on an existing field, the `validation` object and `enumOptions` are immediately cleared to prevent stale data. The live preview re-registers the field with the new type (triggers a partial `reset()` — see Live Preview section).

**Key auto-slugify:** As the user types in the key field, the value is transformed on every keystroke: converted to lowercase, spaces replaced with underscores, and all characters that are not alphanumeric or underscores are stripped. Example: `"Employee ID!"` → `"employee_id"`.

**Key uniqueness validation (advisory):** On blur, the key is checked against all other field keys. A duplicate or empty key shows an inline advisory error below the input. Does not block any action.

**`min` / `max` consistency (advisory):** When both `min` and `max` are provided and `min > max`, an inline advisory warning is shown below the validation fields (e.g., "Min must be ≤ Max"). Does not block any action.

**Field type controls:**
- `string` — shows Min Length, Max Length (number inputs), and Pattern (text input for regex); `min`/`max` represent character length bounds
- `number` — shows Min Value and Max Value (number inputs); `min`/`max` represent numeric value bounds
- `boolean` — no validation section shown; renders as a `Switch` in the live preview
- `enum` — shows enum options editor (see below); no validation section shown

**Enum options editor:** A text input with an "Add" button. Pressing Enter or clicking "Add" appends the trimmed value (max 64 characters) as a tag. Each tag has an ✕ button to remove it. Rules:
- Duplicate option values are rejected with an inline advisory error
- Empty strings are rejected silently
- No maximum number of options
- Dangling text in the input that has not been confirmed with Add/Enter is **not** added automatically — it is discarded on collapse or type-switch

**Invalid regex in Pattern field:** The Pattern value is stored as-is. When `zodSchemaBuilder.ts` builds the zod schema for the preview form, it wraps `new RegExp(pattern)` in a try/catch. If the regex is invalid, the pattern rule is silently skipped for that field. No error is shown at preview time.

**Empty state:** When `FormSchema` is empty, `FieldList` shows a centered placeholder: an icon, the text "No fields yet", and a prompt to click "Add Field".

**Enum field with no options in preview:** Renders a disabled shadcn `Select` with placeholder text "No options defined".

**FieldRow collapsed summary:** Shows the field label if non-empty, otherwise the key if non-empty, otherwise "Untitled field" in muted text. Shows a type badge and a "Required" badge if applicable.

### Live Preview

**Empty state:** When `FormSchema` is empty, `LivePreview` shows a centered placeholder: an icon and the text "Add fields in the builder to see a preview." The submit button is not rendered.

**Reactive sync — when `reset()` is triggered:** `reset()` is called (and `JsonOutputPanel` is hidden) when the schema structure changes: a field is added, removed, or a field's `key` or `type` changes. This reinitializes the form, clearing all entered values and errors for that field.

**Reactive sync — without `reset()`:** Changes to `label`, `required`, `enumOptions`, `min`, `max`, or `pattern` propagate to the preview without calling `reset()`. react-hook-form re-renders with new labels and updated validation rules on the next submit; already-entered values are preserved. The zod resolver is recreated from the updated schema on every render, so updated validation rules take effect on the next submission without clearing values.

**Field rendering by type:**
- `string` → `<Input type="text" />`
- `number` → `<Input type="number" />`
- `boolean` → shadcn `<Switch />`
- `enum` → shadcn `<Select />` with `enumOptions` as items; disabled with placeholder if no options

**Form validation on submit:** `zodSchemaBuilder.ts` is a lightweight utility — a simple loop that builds a `z.object({})` shape from the schema fields. Per-type zod rules: `string` fields use `z.string()` with optional `.min()`, `.max()`, `.regex()`; `number` fields use `z.coerce.number()` with optional `.min()`, `.max()`; `boolean` fields use `z.boolean()`; `enum` fields use `z.enum([...options])` or `z.string()` if options are empty. react-hook-form uses this as its resolver via `@hookform/resolvers/zod`. Inline errors appear below each field.

**JSON output (`JsonOutputPanel`):** On successful submit, a shadcn `Card` appears below the submit button showing `JSON.stringify(values, null, 2)`. `values` are the react-hook-form submitted values — keyed by field `key`. The internal `id` field is never included in the submitted form values. The output reflects `key` values as-is, including any that are empty or duplicate (advisory only).

### Import / Export

**Export:** The Export button serializes `formSchema` to JSON and triggers a browser file download as `form-schema.json`. The `id` field is included (it is part of the schema definition, not part of form submission values).

**Import:** The Import button opens a file picker (`.json` files only). The file is read via `FileReader` and processed in a single try/catch block covering both JSON parse errors and zod validation errors — both result in an error toast.

**Import zod schema** (defined in `importExport.ts`):
- Must be a JSON array
- Each element must have: `key: string`, `label: string`, `type: DataType`
- `id` — preserved if a non-empty string; otherwise a new `uuid()` is generated
- `required` — used if boolean; defaults to `false`
- `enumOptions` — used if array of strings and `type === 'enum'`; stripped to `undefined` for other types
- `validation` — used if valid shape and `type` is `string` or `number`; stripped to `undefined` for other types
- Unknown keys are stripped (zod `.strip()`)

**Toast messages:**
- Success: `"Schema imported — {n} fields loaded."`
- JSON parse failure: `"Import failed: File is not valid JSON."`
- Zod validation failure: `"Import failed: {human-readable summary of first error}"` where the summary is derived from the first zod issue's `path` and `message`, formatted as e.g. `"Field 2 is missing a required 'type' value"` or `"Field 1: 'type' must be one of string, number, boolean, enum"`.

---

## Project Structure

```
src/
├── hooks/
│   └── useFormSchema.ts           ← schema state + all actions
├── components/
│   ├── SchemaBuilder/
│   │   ├── index.tsx              ← header (title, Import/Export), FieldList, AddFieldButton
│   │   ├── FieldList.tsx          ← dnd-kit SortableContext + empty state
│   │   ├── FieldRow.tsx           ← collapsed row + FieldEditor toggle + delete button
│   │   └── FieldEditor.tsx        ← expanded inline config panel
│   └── LivePreview/
│       ├── index.tsx              ← layout wrapper + empty state
│       ├── PreviewForm.tsx        ← react-hook-form setup, PreviewFields, SubmitButton, JsonOutputPanel
│       ├── PreviewField.tsx       ← renders correct input per field type
│       └── JsonOutputPanel.tsx    ← formatted JSON output card
├── utils/
│   ├── slugify.ts                 ← key transform: lowercase, spaces→underscores, strip non-alphanumeric
│   ├── importExport.ts            ← zod import validation schema + export download logic
│   └── zodSchemaBuilder.ts        ← converts FormSchema → zod object schema for preview form validation
├── types.ts                       ← FieldSchema, FormSchema, DataType
└── App.tsx                        ← responsive layout shell
```

---

## Out of Scope (for this prototype)

- Backend persistence — schema lives only in React state
- User authentication / multi-tenant support
- Conditional field logic (show/hide based on other field values)
- Multi-step / wizard-style forms
- Custom styling/theming of the generated form
- Blocking export on invalid schema state
- Character limits beyond those specified in this spec
