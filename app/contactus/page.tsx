import type { Metadata } from "next"

import ImprovedContactForm from "./ContactForm"
import { generateMetadata } from "@/lib/seo"
import { ArticleSchema } from "@/lib/seo"


export const metadata: Metadata = generateMetadata({
  title: "Contact CourseAI - Get Support & Partnership Inquiries",
  description:
    "Get support for CourseAI's AI-powered educational content creation platform. Contact us for technical help, partnerships, enterprise solutions, or general inquiries about our course and quiz generation tools.",
  keywords: [
    "contact courseai",
    "educational technology support",
    "AI content creation help",
    "course generator support",
    "quiz maker assistance",
    "educational platform contact",
    "AI education tools help",
    "enterprise education solutions",
    "partnership inquiries",
    "technical support",
    "customer service",
    "educational software help",
    "courseai"
  ],
  canonical: "/contactus",
  type: "website",
  noIndex: false, // Explicitly allow indexing for contact page
  noFollow: false, // Explicitly allow following links
})

const ContactUsPage = () => {
  // Organization contact information for schema
  const contactInfo = {
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
      <ArticleSchema
        article={{
          headline: "Contact CourseAI - Get in Touch",
          description: "Contact the CourseAI team for support, partnerships, or inquiries about our AI-powered educational platform.",
          image: "/og-image.jpg",
          datePublished: "2024-01-01",
          dateModified: "2024-01-01",
          author: "CourseAI Team",
          url: "https://courseai.io/contactus",
        }}
      />
      <ImprovedContactForm />
    </div>
  )
}

export default ContactUsPage
