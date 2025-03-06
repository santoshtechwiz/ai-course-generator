"use client"

import { generateFAQSchema } from "@/components/json-ld"

interface FAQSchemaProps {
  faqs: {
    question: string
    answer: string
  }[]
}

export default function FAQSchema({ faqs }: FAQSchemaProps) {
  const faqSchema = generateFAQSchema(faqs)

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
}

