/**
 * Global Structured Data Components
 * Enterprise-grade JSON-LD schema implementation for CourseAI
 */

import { OrganizationSchema, SchemaScript } from "@/lib/seo"

// Organization Schema - Core business entity markup
export const organizationSchema = {
  "@context": "https://schema.org" as const,
  "@type": "Organization",
  "name": "CourseAI",
  "url": "https://courseai.io",
  "logo": "https://courseai.io/images/logo.png",
  "description": "AI-powered platform for creating interactive courses and intelligent quizzes with automated content generation and progress tracking.",
  "foundingDate": "2024",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "",
    "contactType": "customer service",
    "email": "support@courseai.io",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://github.com/santoshtechwiz/ai-course-generator"
  ],
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free tier with premium plans available"
  },
  "areaServed": "Worldwide",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "CourseAI Subscription Plans",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Free Plan",
          "description": "Basic course creation and quiz generation"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Premium Plan",
          "description": "Advanced AI features and unlimited usage"
        }
      }
    ]
  }
}

// WebSite Schema - Site-level markup for search engines
export const websiteSchema = {
  "@context": "https://schema.org" as const,
  "@type": "WebSite",
  "name": "CourseAI",
  "url": "https://courseai.io",
  "description": "AI-powered course creation and quiz generation platform",
  "publisher": {
    "@type": "Organization",
    "name": "CourseAI"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://courseai.io/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "inLanguage": "en-US",
  "copyrightHolder": {
    "@type": "Organization",
    "name": "CourseAI"
  }
}

// Global Structured Data Component
export function GlobalStructuredData() {
  return (
    <>
      <OrganizationSchema />
      <SchemaScript schema={websiteSchema} />
    </>
  )
}