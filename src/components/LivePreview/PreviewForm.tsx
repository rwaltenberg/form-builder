import { useEffect, useState, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { PreviewField } from './PreviewField'
import { JsonOutputPanel } from './JsonOutputPanel'
import { buildZodSchema } from '../../utils/zodSchemaBuilder'
import type { FormSchema } from '../../types'
import type { FieldError } from 'react-hook-form'

interface PreviewFormProps {
  schema: FormSchema
}

export function PreviewForm({ schema }: PreviewFormProps) {
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null)

  // Track structural changes (add/remove/key-change/type-change) to trigger reset
  // Sort so reordering does NOT trigger reset
  const structureKey = [...schema].map(f => `${f.key}:${f.type}`).sort().join('|')
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
            error={methods.formState.errors[field.key] as FieldError | undefined}
          />
        ))}

        <Button type="submit" className="w-full">Submit</Button>
      </form>

      {submittedData && <JsonOutputPanel data={submittedData} />}
    </FormProvider>
  )
}
