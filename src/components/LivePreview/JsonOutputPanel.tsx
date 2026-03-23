import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface JsonOutputPanelProps {
  data: Record<string, unknown>
}

export function JsonOutputPanel({ data }: JsonOutputPanelProps) {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">JSON Output</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted rounded p-3 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
