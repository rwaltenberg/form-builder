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
