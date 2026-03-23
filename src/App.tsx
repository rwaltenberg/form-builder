import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from 'sonner'
import { SchemaBuilder } from './components/SchemaBuilder'
import { LivePreview } from './components/LivePreview'
import { useFormSchema } from './hooks/useFormSchema'

export default function App() {
  const formSchemaState = useFormSchema()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />

      {/* Desktop: side-by-side */}
      <div className="hidden md:grid md:grid-cols-2 md:h-screen">
        <div className="border-r overflow-y-auto p-6">
          <SchemaBuilder {...formSchemaState} />
        </div>
        <div className="overflow-y-auto p-6">
          <LivePreview schema={formSchemaState.schema} />
        </div>
      </div>

      {/* Mobile: tabbed */}
      <div className="md:hidden p-4">
        <Tabs defaultValue="builder">
          <TabsList className="w-full">
            <TabsTrigger value="builder" className="flex-1">Builder</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="builder" className="mt-4">
            <SchemaBuilder {...formSchemaState} />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <LivePreview schema={formSchemaState.schema} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
