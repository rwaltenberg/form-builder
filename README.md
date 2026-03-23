# Form Schema Builder

A browser-based tool for designing custom data-entry forms without writing code. Define fields, configure validation, reorder via drag-and-drop, and see a live preview of the resulting form — all in one view.

## Features

- **Visual schema editor** — add, edit, and remove form fields through a clean UI
- **Field types** — text, number, email, textarea, select, checkbox, and more
- **Validation rules** — required, min/max length, numeric ranges, and custom patterns
- **Drag-and-drop reordering** — rearrange fields in the builder using dnd-kit
- **Live preview** — the right panel renders a fully functional form in real time, powered by react-hook-form + zod
- **JSON output** — copy the generated schema as JSON for use in other systems
- **Import / export** — save and reload schemas as JSON files
- **Responsive layout** — side-by-side panels on desktop, tabbed interface on mobile

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styles | Tailwind CSS v4 |
| UI components | shadcn/ui (Base UI) |
| Drag-and-drop | dnd-kit |
| Form engine | react-hook-form + zod |
| Notifications | Sonner |
| Testing | Vitest + React Testing Library |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with HMR |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |
| `npm run test:unit` | Run the Vitest unit test suite |
| `npm run test:unit:ui` | Open the Vitest browser UI |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Open the Playwright UI |

## Project Structure

```
src/
├── components/
│   ├── SchemaBuilder/   # Field list, field editor, add-field button
│   └── LivePreview/     # Live form renderer and JSON output panel
├── hooks/
│   └── useFormSchema.ts # Central state — fields CRUD + reordering
├── utils/
│   ├── slugify.ts       # Field name generation
│   ├── importExport.ts  # JSON serialisation helpers
│   └── zodSchemaBuilder.ts # Builds a zod schema from the field list
├── types.ts             # Shared TypeScript types
└── App.tsx              # Root layout (desktop split / mobile tabs)
```

## How It Works

1. **Add a field** — click *Add Field* to append a new entry to the schema
2. **Configure it** — set the label, type, placeholder, and validation rules in the editor panel
3. **Reorder** — drag the handle on any field row to change its position
4. **Preview** — the live preview panel updates instantly; submit the preview form to see validation in action
5. **Export** — copy the JSON output or download it as a file; re-import it later to resume editing
