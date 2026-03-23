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
