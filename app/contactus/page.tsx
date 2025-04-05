import type { Metadata } from "next"
import { ImprovedContactForm } from "./ContactForm"
import { generatePageMetadata } from "@/lib/seo-utils"

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
  ],
  ogImage: "/api/og?title=Contact+CourseAI&description=Get+Support+for+AI+Coding+Education",
})


const ContactUsPage = () => {
  return (
    <div className="container py-12">
      <ImprovedContactForm />
    </div>
  )
}

export default ContactUsPage;