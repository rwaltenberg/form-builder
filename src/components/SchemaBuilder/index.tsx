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
          toast.error(`Couldn't import schema — ${formatImportError(result.issues)}`)
        }
      } catch {
        toast.error("That file doesn't look like valid JSON — please check it and try again.")
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
