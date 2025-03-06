"use client"

import { generateFAQSchema } from "@/components/json-ld"

interface FAQSchemaProps {
  items: {
    question: string
    answer: string
  }[]
}

export default function FAQSchema({ items }: FAQSchemaProps) {
  const faqSchema = generateFAQSchema(items)

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
}

