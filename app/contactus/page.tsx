import type { Metadata } from "next"

import { generatePageMetadata } from "@/lib/seo-utils"
import ImprovedContactForm from "./ContactForm"

export const metadata: Metadata = generatePageMetadata({
  title: "Contact CourseAI | Get Support for AI Coding Education Platform",
  description:
    "Have questions about CourseAI's AI-powered coding education platform? Contact our team for support, partnership inquiries, or feedback on our programming learning tools.",
  path: "/contactus",
  keywords: [
    "contact courseai",
    "coding education support",
    "ai learning platform help",
    "programming education contact",
    "courseai support",
    "coding question generator help",
    "programming learning assistance",
    "ai education platform contact",
    "developer education help",
    "tech learning support",
    "programming course assistance",
    "coding quiz help",
  ],
  ogImage: "/api/og?title=Contact+CourseAI&description=Get+Support+for+AI+Coding+Education",
})

const ContactUsPage = () => {
  // Organization contact information for schema
  const contactInfo = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "CourseAI Contact Page",
    description:
      "Contact the CourseAI team for support, partnership inquiries, or feedback on our programming education platform.",
    mainEntity: {
      "@type": "Organization",
      name: "CourseAI",
      url: "https://courseai.io",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "",
        contactType: "customer service",
        email: "support@courseai.io",
        availableLanguage: "English",
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "United States",
      },
    },
  }

  return (
    <div className="container py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactInfo) }} />
      <ImprovedContactForm />
    </div>
  )
}

export default ContactUsPage
