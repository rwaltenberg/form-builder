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
  const [keyInputValue, setKeyInputValue] = useState(field.key)
  const [enumInput, setEnumInput] = useState('')
  const [enumError, setEnumError] = useState<string | null>(null)

  function handleKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugged = slugify(e.target.value)
    setKeyInputValue(slugged)
    onUpdate({ key: slugged })
  }

  function handleKeyBlur() {
    if (!keyInputValue) {
      setKeyError('A key is required for this field')
    } else if (allKeys.includes(keyInputValue)) {
      setKeyError('Duplicate key — this one is already in use')
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
      setEnumError('That option is already in the list')
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
      ? "Min can't exceed Max"
      : null

  return (
    <div className="space-y-4 p-4 border-t">
      {/* Key */}
      <div className="space-y-1">
        <Label htmlFor={`key-${field.id}`}>Key</Label>
        <Input
          id={`key-${field.id}`}
          value={keyInputValue}
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
