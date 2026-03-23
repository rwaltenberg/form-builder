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
