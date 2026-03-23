import { FileQuestion } from 'lucide-react'
import { PreviewForm } from './PreviewForm'
import type { FormSchema } from '../../types'

interface LivePreviewProps {
  schema: FormSchema
}

export function LivePreview({ schema }: LivePreviewProps) {
  if (schema.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Live Preview</h2>
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
          <FileQuestion className="h-10 w-10" />
          <p className="text-sm">Add fields in the builder to see a preview.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Live Preview</h2>
      <PreviewForm schema={schema} />
    </div>
  )
}
