import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AddFieldButtonProps {
  onClick: () => void
}

export function AddFieldButton({ onClick }: AddFieldButtonProps) {
  return (
    <Button onClick={onClick} variant="outline" className="w-full gap-2">
      <Plus className="h-4 w-4" />
      Add Field
    </Button>
  )
}
