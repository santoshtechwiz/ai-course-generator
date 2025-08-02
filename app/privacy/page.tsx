import { generateMetadata } from "@/lib/seo"
import type { Metadata } from "next"
import Link from "next/link"
import { JsonLD } from "@/lib/seo"

export const metadata: Metadata = generateMetadata({
  title: "Privacy Policy | CourseAI Educational Platform",
  description:
    "Learn how CourseAI protects your data while providing AI-powered educational services. Our commitment to your privacy and security in online learning.",
  keywords: [
    "privacy policy",
    "data protection",
    "educational platform privacy",
    "AI education privacy",
    "online learning security",
    "courseai privacy",
    "educational data policy",
    "developer training privacy",
    "coding course data protection",
    "programming quiz privacy",
    "AI learning data security",
  ],
  canonical: "/privacy",
  type: "article",
})

export default function PrivacyPolicy() {
  // Privacy policy schema
  const privacySchema = {
    "@type": "WebPage",
    name: "CourseAI Privacy Policy",
    description: "Learn how CourseAI protects your data while providing programming education services.",
    mainEntity: {
      "@type": "Article",
      name: "Privacy Policy",
      headline: "CourseAI Privacy Policy",
      description: "Our commitment to your privacy and security while using our programming education platform.",
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
      <JsonLD type="webPage" data={privacySchema} />

      <h1 className="text-3xl font-bold mb-6 text-foreground">Privacy Policy</h1>

      <p className="mb-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4 text-foreground">
        CourseAI ("we", "our", or "us") values your privacy and is committed to protecting your personal data. This
        Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website
        [https://courseai.io] (the "Site") or use our services.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">1. Information We Collect</h2>

      <p className="mb-4 text-foreground">We may collect and process different types of information, including:</p>

      <ul className="list-disc pl-8 mb-4 text-foreground">
        <li>Personal Information: Name, email address, account details, and other data voluntarily provided by you.</li>
        <li>Technical Data: IP address, browser type, operating system, and other device details.</li>
        <li>
          Usage Data: Information on how you interact with our Site, including page views, time spent, and other
          analytics.
        </li>
        <li>Third-Party Information: Data obtained through Google, YouTube, or other integrated services.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">2. How We Use Your Information</h2>

      <p className="mb-4 text-foreground">We process your information for the following purposes:</p>

      <ul className="list-disc pl-8 mb-4 text-foreground">
        <li>To provide, operate, and maintain our services.</li>
        <li>To enhance user experience and improve website functionality.</li>
        <li>To analyze trends and monitor website performance.</li>
        <li>To communicate with you, including responding to inquiries and providing updates.</li>
        <li>To comply with legal obligations and enforce our policies.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">3. Third-Party Services</h2>

      <p className="mb-4 text-foreground">
        Our Site may use third-party services, including but not limited to Google and YouTube, which may collect and
        process your information. These services operate independently and have their own privacy policies. We encourage
        you to review their policies to understand how your data is handled.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">4. Cookies and Tracking Technologies</h2>

      <p className="mb-4 text-foreground">
        We use cookies and similar tracking technologies to enhance your experience, analyze site traffic, and
        personalize content. You may disable cookies through your browser settings, but this may affect certain
        functionalities of the Site.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">5. Data Security</h2>

      <p className="mb-4 text-foreground">
        We implement reasonable security measures to safeguard your personal information. However, no online service is
        entirely secure, and we cannot guarantee absolute security. If you suspect a security breach, please contact us
        immediately.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">6. Your Data Protection Rights</h2>

      <p className="mb-4 text-foreground">
        Depending on your location, you may have the following rights under applicable data protection laws:
      </p>

      <ul className="list-disc pl-8 mb-4 text-foreground">
        <li>The right to access, update, or delete your personal data.</li>
        <li>The right to object to or restrict certain types of data processing.</li>
        <li>The right to data portability.</li>
        <li>The right to withdraw consent where processing is based on consent.</li>
        <li>The right to lodge a complaint with a data protection authority.</li>
      </ul>

      <p className="mb-4 text-foreground">To exercise these rights, please contact us at support@courseai.io.</p>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">7. Data Retention</h2>

      <p className="mb-4 text-foreground">
        We retain your personal data only as long as necessary for the purposes outlined in this Privacy Policy or as
        required by law. When no longer needed, we securely delete or anonymize your data.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">8. International Data Transfers</h2>

      <p className="mb-4 text-foreground">
        If you access our Site from outside your country, your data may be transferred to and processed in other
        jurisdictions with different data protection laws. By using our services, you consent to such transfers.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">9. Changes to This Privacy Policy</h2>

      <p className="mb-4 text-foreground">
        We may update this Privacy Policy from time to time to reflect legal or operational changes. Any updates will be
        posted on this page with a revised "Last updated" date. We encourage you to review this page periodically.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">10. Contact Us</h2>

      <p className="mb-4 text-foreground">
        If you have any questions or concerns about this Privacy Policy, please contact us at support@courseai.io.
      </p>

      <p className="mt-8">
        <Link href="/terms" className="text-blue-600 hover:underline">
          View our Terms and Conditions
        </Link>
      </p>
    </div>
  )
}
