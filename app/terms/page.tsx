import Link from 'next/link';
import type { Metadata } from "next"
import { generatePageMetadata } from '@/lib/seo-utils';

export const metadata: Metadata = generatePageMetadata({
  title: "Terms of Service | CourseAI Coding Education",
  description:
    "Review the terms and conditions for using CourseAI's programming education platform. Understanding our policies for a better learning experience.",
  path: "/terms",
  keywords: [
    "coding education terms",
    "programming learning conditions",
    "developer education agreement",
    "coding platform terms",
    "programming learning policies",
  ],
})

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      
      <p className="mb-4">Last updated: {new Date().toLocaleDateString('en-US')}</p>
      
      <p className="mb-4">
        Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using the courseai.dev website (the "Service") operated by CourseAI ("us", "we", or "our").
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
      
      <p className="mb-4">
        By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">2. Use of Third-Party Services</h2>
      
      <p className="mb-4">
        Our Service integrates third-party services, including but not limited to YouTube and Google Gemini. By using our Service, you acknowledge and agree that:
      </p>
      
      <ul className="list-disc pl-8 mb-4">
        <li>These third-party services are subject to their own terms and conditions and privacy policies.</li>
        <li>CourseAI is not responsible for any interruptions, errors, or issues arising from the use of these third-party services.</li>
        <li>We do not guarantee the accuracy, completeness, or availability of content provided through these services.</li>
        <li>Users must comply with the terms of service of any third-party provider while using our Service.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">3. Content and Intellectual Property</h2>
      
      <p className="mb-4">
        The content displayed on our Service, including videos and educational materials, is primarily sourced from YouTube and other third-party platforms. CourseAI does not claim ownership of this content and respects the intellectual property rights of the content creators.
      </p>
      
      <p className="mb-4">
        If you believe that any content on our Service infringes upon your intellectual property rights, please contact us immediately with the relevant details.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">4. AI-Generated Content</h2>
      
      <p className="mb-4">
        Our Service uses AI-powered tools to generate or assist in content creation. Users should be aware that:
      </p>
      
      <ul className="list-disc pl-8 mb-4">
        <li>AI-generated content may contain errors, biases, or inaccuracies.</li>
        <li>Users should not rely solely on AI-generated content for critical decisions, including but not limited to legal, medical, financial, or educational matters.</li>
        <li>CourseAI does not guarantee the accuracy or reliability of AI-generated content and is not liable for any damages arising from reliance on such content.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">5. Limitation of Liability</h2>
      
      <p className="mb-4">
        To the maximum extent permitted by law, CourseAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
      </p>
      
      <ul className="list-disc pl-8 mb-4">
        <li>Your use or inability to use the Service.</li>
        <li>Any conduct or content of any third party on the Service.</li>
        <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
        <li>Reliance on AI-generated content or third-party API services.</li>
        <li>Any security vulnerabilities or unauthorized access to user data.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">6. User Responsibilities</h2>
      
      <p className="mb-4">
        As a user of our Service, you agree to:
      </p>
      
      <ul className="list-disc pl-8 mb-4">
        <li>Use the Service in compliance with all applicable laws and regulations.</li>
        <li>Not engage in any activity that interferes with or disrupts the Service.</li>
        <li>Not attempt to gain unauthorized access to any portion of the Service.</li>
        <li>Respect the intellectual property rights of content creators and third-party services.</li>
        <li>Not use the Service for any unlawful, fraudulent, or malicious purposes.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">7. Modifications to the Service</h2>
      
      <p className="mb-4">
        CourseAI reserves the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the Service.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">8. Governing Law</h2>
      
      <p className="mb-4">
        These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">9. Changes to These Terms</h2>
      
      <p className="mb-4">
        We reserve the right to update or change our Terms and Conditions at any time. We will notify you of any changes by posting the new Terms and Conditions on this page. Your continued use of the Service after any modifications constitutes acceptance of the new Terms.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">10. Contact Us</h2>
      
      <p className="mb-4">
        If you have any questions about these Terms, please contact us at support@courseai.dev.
      </p>
      
      <p className="mt-8">
        <Link href="/privacy" className="text-blue-600 hover:underline">
          View our Privacy Policy
        </Link>
      </p>
    </div>
  );
}
