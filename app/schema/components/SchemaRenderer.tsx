"use client"

import { useState } from "react"
import { SchemaRegistry, validateSchema } from "@/lib/schema"

interface SchemaRendererProps {
  type: keyof typeof SchemaRegistry
  data?: any
  showValidation?: boolean
}

export function SchemaRenderer({ type, data, showValidation = false }: SchemaRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!SchemaRegistry[type]) {
    return <div className="text-red-500">Schema type "{type}" not found</div>
  }

  try {
    // Generate schema based on type and data
    const schema = SchemaRegistry[type](data ?? {})

    // Validate schema if requested
    const isValid = showValidation ? validateSchema(schema) : true
    const schemaString = JSON.stringify(schema, null, 2)

    return (
      <div className="my-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">
            {type} Schema{" "}
            {showValidation && (
              <span className={isValid ? "text-green-500" : "text-red-500"}>({isValid ? "Valid" : "Invalid"})</span>
            )}
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>

        {isExpanded ? (
          <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm">{schemaString}</pre>
        ) : (
          <pre className="bg-gray-50 p-4 rounded overflow-hidden text-sm whitespace-nowrap text-ellipsis">
            {schemaString.substring(0, 100)}...
          </pre>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="my-4 p-4 bg-red-50 text-red-500 rounded">
        <h3 className="font-medium">Error rendering {type} schema</h3>
        <p>{(error as Error).message}</p>
      </div>
    )
  }
}

