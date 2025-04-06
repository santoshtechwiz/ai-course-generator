import type { Schema } from "@/lib/schema"

interface SchemaRendererProps {
  schema: Schema
}

/**
 * Generic component to render any schema as JSON-LD
 * Use this for one-off schema rendering needs
 */
export default function SchemaRenderer({ schema }: SchemaRendererProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

