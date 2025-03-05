import { generateBreadcrumbSchema } from "@/lib/seo-utils"

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string
    path: string
  }>
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  const breadcrumbItems = items.map((item) => ({
    name: item.name,
    url: `${baseUrl}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
  }))

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems)

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
}

