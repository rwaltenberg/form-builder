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
