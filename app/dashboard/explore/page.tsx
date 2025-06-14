import { JsonLD } from "@/app/schema/components"
import { generateMetadata } from "@/lib/seo"
import { CreateComponent } from "@/components/features/explore/CreateComponent"
import type { Metadata } from "next"

// Enhanced metadata for better SEO
export const metadata: Metadata = generateMetadata({
  title: "Explore AI-Powered Quizzes | Create and Learn",
  description:
    "Create professional-quality educational content in minutes with our AI tools. Generate MCQs, open-ended questions, fill-in-the-blank exercises, and complete courses for any subject.",
  path: "/dashboard/explore",
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
  ],
  ogImage: {
    url: "/og-image-explore.jpg",
    width: 1200,
    height: 630,
    alt: "CourseAI Content Creation Tools",
  },
})

export default function ExplorePage() {
  // Schema.org structured data for FAQs
  const faqSchema = {
    mainEntity: [
      {
        question: "How does CourseAI generate educational content?",
        answer:
          "CourseAI uses advanced artificial intelligence to analyze your topic and generate high-quality educational content including multiple-choice questions, open-ended questions, fill-in-the-blank exercises, and complete courses.",
      },
      {
        question: "Can I create programming quizzes with CourseAI?",
        answer:
          "Yes! CourseAI specializes in creating programming-related educational content. You can generate coding MCQs, algorithm challenges, code completion exercises, and debugging questions for languages including JavaScript, Python, Java, C++, and many others.",
      },
      {
        question: "How accurate is the AI-generated content?",

        answer:
          "CourseAI's content generation is highly accurate, especially for technical and programming topics. However, we always recommend reviewing AI-generated content before publishing. Our tools allow you to easily edit and refine the generated content to ensure it meets your specific requirements.",
      },
      {
        name: "Can I customize the difficulty level of generated questions?",

        answer:
          "CourseAI allows you to specify the difficulty level (beginner, intermediate, advanced) for all generated content. This ensures the questions and exercises match your audience's knowledge level and learning objectives.",
      },
    ],
  }

  return (
    <>
      <JsonLD type="faq" data={faqSchema} />

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
