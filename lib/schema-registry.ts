import { SchemaRegistry as BaseSchemaRegistry, type Schema } from "@/lib/schema"

// Schema Registry Service for better organization and extensibility
export class SchemaRegistryService {
  private static instance: SchemaRegistryService
  private customSchemas: Record<string, (data?: any) => Schema> = {}

  private constructor() {}

  public static getInstance(): SchemaRegistryService {
    if (!SchemaRegistryService.instance) {
      SchemaRegistryService.instance = new SchemaRegistryService()
    }
    return SchemaRegistryService.instance
  }

  // Register a custom schema generator
  public register(name: string, generator: (data?: any) => Schema): void {
    this.customSchemas[name] = generator
  }

  // Get a schema generator by name
  public get(name: string): ((data?: any) => Schema) | undefined {
    // First check custom schemas
    if (this.customSchemas[name]) {
      return this.customSchemas[name]
    }

    // Then check base registry
    const baseRegistry = BaseSchemaRegistry as Record<string, (data?: any) => Schema>
    return baseRegistry[name]
  }

  // Generate a schema by name
  public generate(name: string, data?: any): Schema | null {
    const generator = this.get(name)
    if (!generator) {
      console.warn(`Schema generator "${name}" not found`)
      return null
    }

    try {
      return generator(data)
    } catch (error) {
      console.error(`Error generating schema "${name}":`, error)
      return null
    }
  }

  // Get all available schema types
  public getAvailableSchemas(): string[] {
    const baseRegistry = BaseSchemaRegistry as Record<string, (data?: any) => Schema>
    return [...Object.keys(baseRegistry), ...Object.keys(this.customSchemas)]
  }
}

// Export singleton instance
export const schemaRegistry = SchemaRegistryService.getInstance()

// Example of registering a custom schema
// schemaRegistry.register("CustomSchema", (data) => {
//   return {
//     "@context": "https://schema.org",
//     "@type": "Thing",
//     name: data?.name || "Custom Schema",
//     description: data?.description || "A custom schema example",
//   };
// });

