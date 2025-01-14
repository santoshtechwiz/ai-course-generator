import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <p className="mb-4">Last updated: [Current Date]</p>
      
      <p className="mb-4">
        CourseAI ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website [https://courseai.dev] (the "Site") or use our services.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
      
      <p className="mb-4">We collect information from you when you use our Site, including:</p>
      
      <ul className="list-disc pl-8 mb-4">
        <li>Personal information you provide voluntarily (e.g., name, email address)</li>
        <li>Usage data (e.g., IP address, browser type, pages visited)</li>
        <li>Information collected through third-party services (e.g., Google, YouTube)</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">2. How We Use Your Information</h2>
      
      <p className="mb-4">We use the collected information for various purposes, including:</p>
      
      <ul className="list-disc pl-8 mb-4">
        <li>Providing and maintaining our services</li>
        <li>Improving and personalizing user experience</li>
        <li>Analyzing usage patterns and trends</li>
        <li>Communicating with you about our services</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">3. Third-Party Services</h2>
      
      <p className="mb-4">
        Our Site integrates third-party services, including YouTube and Google Gemini. These services may collect information about you. We encourage you to review the privacy policies of these third-party services.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">4. Cookies and Tracking Technologies</h2>
      
      <p className="mb-4">
        We use cookies and similar tracking technologies to collect and track information about your browsing activities. You can control cookies through your browser settings.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">5. Data Security</h2>
      
      <p className="mb-4">
        We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">6. Your Data Protection Rights</h2>
      
      <p className="mb-4">
        Depending on your location, you may have certain rights regarding your personal data, including the right to access, correct, or delete your data. To exercise these rights, please contact us at [Your Contact Email].
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">7. Changes to This Privacy Policy</h2>
      
      <p className="mb-4">
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
      </p>
      
      <h2 className="text-2xl font-semibold mt-6 mb-4">8. Contact Us</h2>
      
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us at [Your Contact Email].
      </p>
      
      <p className="mt-8">
        <Link href="/terms" className="text-blue-600 hover:underline">
          View our Terms and Conditions
        </Link>
      </p>
    </div>
  )
}

