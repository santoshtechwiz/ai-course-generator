import Link from "next/link"
import type { Metadata } from "next"
import { generateOptimizedMetadata } from "@/lib/seo"
import { JsonLD } from "@/lib/seo"

export const metadata: Metadata = generateOptimizedMetadata({
  title: "Terms of Service | CourseAI Educational Platform",
  description:
    "Review the terms and conditions for using CourseAI's AI-powered educational platform. Understanding our policies for a better learning experience.",
  keywords: [
    "terms of service",
    "user agreement",
    "educational platform terms",
    "AI education terms",
    "online learning conditions",
    "courseai terms",
    "educational service agreement",
    "user policies",
    "platform guidelines",
    "service conditions",
  ],
  canonicalPath: "/terms",
  type: "article",
})

export default function TermsOfService() {
  // Terms of service schema
  const termsSchema = {
    "@type": "WebPage",
    name: "CourseAI Terms of Service",
    description: "Terms and conditions for using CourseAI's AI-powered educational platform.",
    mainEntity: {
      "@type": "Article",
      name: "Terms of Service",
      headline: "CourseAI Terms of Service",
      description: "Our terms and conditions for using the CourseAI educational platform.",
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      author: {
        "@type": "Organization",
        name: "CourseAI",
      },
    },
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <JsonLD type="webPage" data={termsSchema} />

      <h1 className="text-3xl font-bold mb-6 text-foreground">Terms of Service</h1>

      <p className="mb-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose max-w-none dark:prose-invert">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using CourseAI's educational platform, you accept and agree to be bound by the terms and provision of this agreement.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily download one copy of the materials on CourseAI's platform for personal, non-commercial transitory viewing only.
        </p>

        <h2>3. Disclaimer</h2>
        <p>
          The materials on CourseAI's platform are provided on an 'as is' basis. CourseAI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>

        <h2>4. Limitations</h2>
        <p>
          In no event shall CourseAI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on CourseAI's platform, even if CourseAI or a CourseAI authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
        </p>

        <h2>5. Accuracy of Materials</h2>
        <p>
          The materials appearing on CourseAI's platform could include technical, typographical, or photographic errors. CourseAI does not warrant that any of the materials on its platform are accurate, complete, or current. CourseAI may make changes to the materials contained on its platform at any time without notice. However, CourseAI does not make any commitment to update the materials.
        </p>

        <h2>6. Links</h2>
        <p>
          CourseAI has not reviewed all of the sites linked to our platform and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by CourseAI of the site. Use of any such linked website is at the user's own risk.
        </p>

        <h2>7. Modifications</h2>
        <p>
          CourseAI may revise these terms of service for its platform at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.
        </p>

        <h2>8. Governing Law</h2>
        <p>
          These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
        </p>

        <h2>9. User Content</h2>
        <p>
          By submitting content to CourseAI, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content in connection with our educational services.
        </p>

        <h2>10. Privacy Policy</h2>
        <p>
          Your privacy is important to us. Please review our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          , which also governs your use of the platform.
        </p>

        <h2>11. Educational Use</h2>
        <p>
          CourseAI is designed for educational purposes. Users are responsible for ensuring their use of generated content complies with applicable educational standards and regulations.
        </p>

        <h2>12. AI-Generated Content</h2>
        <p>
          CourseAI uses artificial intelligence to generate educational content. While we strive for accuracy, users should review and verify all AI-generated content before use in critical educational settings.
        </p>

        <h2>13. Account Termination</h2>
        <p>
          We reserve the right to terminate accounts that violate these terms or engage in harmful activities on our platform.
        </p>

        <h2>14. Contact Information</h2>
        <p>
          If you have any questions about these Terms of Service, please{" "}
          <Link href="/contactus" className="text-primary hover:underline">
            contact us
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
