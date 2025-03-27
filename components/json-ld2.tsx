import { breadcrumbSchema } from "@/app/schema/breadcrumbSchema"
import { quizSchema } from "@/schema/schema"


export function JsonLd({ currentPage = "home" }: { currentPage?: string }) {
  // Base URL for the site
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // Pricing data
  const pricingData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Course AI",
    description: "AI-powered platform for creating courses, quizzes, and educational content",
    image: `${baseUrl}/images/courseai-logo.png`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "49.99",
      offerCount: "3",
      offers: [
        {
          "@type": "Offer",
          name: "Free Trial",
          price: "0",
          priceCurrency: "USD",
          description: "3 Day Free Trial with limited features",
          url: `${baseUrl}/pricing#free-trial`,
        },
        {
          "@type": "Offer",
          name: "Basic Plan",
          price: "19.99",
          priceCurrency: "USD",
          description: "25 Hosted Courses",
          url: `${baseUrl}/pricing#basic`,
        },
        {
          "@type": "Offer",
          name: "Premium Plan",
          price: "49.99",
          priceCurrency: "USD",
          description: "Unlimited courses and premium features",
          url: `${baseUrl}/pricing#premium`,
        },
      ],
    },
  }

  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Course AI",
    url: baseUrl,
    logo: `${baseUrl}/images/courseai-logo.png`,
    sameAs: ["https://twitter.com/courseai", "https://facebook.com/courseai", "https://linkedin.com/company/courseai"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-800-123-4567",
      contactType: "customer service",
      availableLanguage: "English",
    },
  }

  // WebSite schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Course AI",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  // Enhanced WebApplication schema
  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Course AI Quiz Generator",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: "AI-powered platform for creating quizzes, assessments, and educational content instantly",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AI Quiz Generation",
      "Multiple Choice Questions",
      "True/False Questions",
      "Open-Ended Questions",
      "Video Quiz Creation",
      "PDF Quiz Generation",
      "Custom Templates",
      "Analytics Dashboard",
      "Automated Grading",
      "Question Bank",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1000",
      bestRating: "5",
      worstRating: "1",
    },
    provider: {
      "@type": "Organization",
      name: "Course AI",
      url: baseUrl,
    },
    screenshot: `${baseUrl}/images/courseai-screenshot.png`,
    softwareVersion: "2.0",
    url: baseUrl,
  }

  // Enhanced FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does the AI quiz generator work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our AI analyzes your content (text, PDF, or video) and automatically generates relevant quiz questions, multiple choice options, and complete assessments in seconds.",
        },
      },
      {
        "@type": "Question",
        name: "What types of quizzes can I create?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can create multiple-choice questions, true/false questions, open-ended questions, and complete assessments. The platform supports various content formats including text, PDF, and video.",
        },
      },
      {
        "@type": "Question",
        name: "Can I customize the generated quizzes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can fully customize all generated quizzes. Edit questions, modify answers, adjust difficulty levels, and apply your own templates to match your specific needs.",
        },
      },
      {
        "@type": "Question",
        name: "How can I use Course AI for my classroom?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Course AI is perfect for classroom use. Create quizzes from your teaching materials, generate homework assignments, develop practice tests, and track student progress through our analytics dashboard.",
        },
      },
      {
        "@type": "Question",
        name: "Can I generate quizzes from videos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Course AI can analyze video content and automatically generate relevant quizzes. Simply upload your video, and our AI will create questions based on the video content.",
        },
      },
      {
        "@type": "Question",
        name: "What pricing plans do you offer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We offer a 3-day free trial, a Basic plan at $19.99/month with 25 hosted courses, and a Premium plan at $49.99/month with unlimited courses and premium features. Visit our pricing page for more details.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a free version of Course AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, we offer a 3-day free trial that gives you access to our core features so you can experience the power of our AI quiz generation before committing to a paid plan.",
        },
      },
    ],
  }

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      {/* Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      {/* WebApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
        }}
      />

      {/* Quiz Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(quizSchema),
        }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* Pricing Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pricingData),
        }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
    </>
  )
}

