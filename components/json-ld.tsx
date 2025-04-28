"use client"

import { useEffect, useState } from "react"

interface JsonLdProps {
  type: "default" | "quiz" | "breadcrumb" | "faq" | "article" | "product"
  data?: Record<string, any>
}

export function JsonLd({ type, data }: JsonLdProps) {
  const [jsonLd, setJsonLd] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    // Default website schema
    if (type === "default") {
      setJsonLd({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "CourseAI",
        description: "Interactive programming quizzes and learning resources for developers",
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        sameAs: [
          "https://twitter.com/courseai",
          "https://github.com/courseai",
          "https://linkedin.com/company/courseai",
        ],
      })
    } else if (data) {
      setJsonLd(data)
    }
  }, [type, data])

  if (!jsonLd) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
    />
  )
}
