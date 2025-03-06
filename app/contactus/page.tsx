import type { Metadata } from "next"
import { ImprovedContactForm } from "./ContactForm"
import { generatePageMetadata } from "@/lib/seo-utils"

export const metadata: Metadata = generatePageMetadata({
  title: "Contact CourseAI | Programming Education Support",
  description:
    "Get in touch with our coding education experts. We're here to help with your programming learning journey and answer any questions.",
  path: "/contactus",
  keywords: [
    "contact coding support",
    "programming education help",
    "coding learning assistance",
    "developer education contact",
    "programming learning support",
  ],
})


const ContactUsPage = () => {
  return (
    <div className="container py-12">
      <ImprovedContactForm />
    </div>
  )
}

export default ContactUsPage;