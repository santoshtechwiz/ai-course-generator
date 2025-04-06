import { JsonLd } from "@/app/schema/components/json-ld"
import { CreateComponent } from "@/components/features/explore/CreateComponent"

import type { Metadata } from "next"

// Enhanced metadata for better SEO
export const metadata: Metadata = {
  title: "AI-Powered Course Creation Tools | Generate MCQs, Quizzes & Learning Materials",
  description:
    "Create professional-quality educational content in minutes with our AI tools. Generate MCQs, open-ended questions, fill-in-the-blank exercises, and complete courses for any subject. Perfect for educators, trainers, and content creators.",
  keywords: [
    "AI course creation",
    "MCQ generator",
    "open-ended questions",
    "fill in the blank exercises",
    "e-learning tools",
    "AI teaching assistant",
    "educational content creator",
    "quiz maker",
    "course authoring tool",
    "automated question generation",
    "programming quiz creator",
    "coding assessment generator",
    "educational technology",
    "AI for educators",
    "learning material generator",
  ],
  openGraph: {
    title: "AI-Powered Course Creation Tools | Generate MCQs, Quizzes & Learning Materials",
    description:
      "Create professional-quality educational content in minutes with our AI tools. Generate MCQs, open-ended questions, and complete courses for any subject.",
    images: [
      {
        url: "/og-image-explore.jpg",
        width: 1200,
        height: 630,
        alt: "CourseAI Content Creation Tools",
      },
    ],
    locale: "en_US",
    type: "website",
    siteName: "CourseAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Educational Content with AI | CourseAI Tools",
    description:
      "Revolutionize your teaching with our AI-powered course creation tools. Generate quizzes, questions, and courses in minutes.",
    images: ["/twitter-image-explore.jpg"],
    creator: "@courseai",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_WEBSITE_URL
      ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/explore`
      : "https://courseai.io/dashboard/explore",
  },
}

// Schema.org structured data for FAQs
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does CourseAI generate educational content?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CourseAI uses advanced artificial intelligence to analyze your topic and generate high-quality educational content including multiple-choice questions, open-ended questions, fill-in-the-blank exercises, and complete courses. The AI understands educational best practices and creates content that is accurate, engaging, and pedagogically sound.",
      },
    },
    {
      "@type": "Question",
      name: "Can I create programming quizzes with CourseAI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! CourseAI specializes in creating programming-related educational content. You can generate coding MCQs, algorithm challenges, code completion exercises, and debugging questions for languages including JavaScript, Python, Java, C++, and many others.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is the AI-generated content?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CourseAI's content generation is highly accurate, especially for technical and programming topics. However, we always recommend reviewing AI-generated content before publishing. Our tools allow you to easily edit and refine the generated content to ensure it meets your specific requirements.",
      },
    },
    {
      "@type": "Question",
      name: "Can I customize the difficulty level of generated questions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CourseAI allows you to specify the difficulty level (beginner, intermediate, advanced) for all generated content. This ensures the questions and exercises match your audience's knowledge level and learning objectives.",
      },
    },
  ],
}

export default function ExplorePage() {
  return (
    <>
      {/* Add structured data */}
     
      <JsonLd data={faqSchema} type="faq"/>

      {/* Main component */}
      <CreateComponent />

      {/* 
        SEO Enhancement Note:
        
        For optimal SEO, consider enhancing the CreateComponent to include:
        
        1. Semantic HTML structure with proper heading hierarchy (h1, h2, h3)
        2. Descriptive text about each tool with relevant keywords
        3. User testimonials or reviews
        4. Example use cases for each tool
        5. FAQ section that matches the schema above
        6. Internal links to related content
        7. Call-to-action buttons with descriptive text
        
        These enhancements will significantly improve search engine visibility
        while providing a better user experience.
      */}
    </>
  )
}

