
import { CreateComponent } from "@/components/features/explore/CreateComponent";
import type { Metadata } from "next";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { generateOptimizedMetadata } from "@/lib/seo";
import { JsonLD } from "@/lib/seo";

// Enhanced metadata for better SEO
export const metadata: Metadata = generateOptimizedMetadata({
  title: "AI Content Creator - Generate Courses, Quizzes & Assessments",
  description:
    "Create professional educational content instantly with AI. Generate interactive courses, multiple-choice questions, open-ended assessments, and fill-in-the-blank exercises for any subject. Perfect for educators, trainers, and content creators.",
  keywords: [
    "AI content generator",
    "course creation tool",
    "quiz generator",
    "MCQ creator",
    "educational content AI",
    "assessment builder",
    "e-learning tools",
    "automated question generation",
    "teaching materials creator",
    "educational technology",
    "AI-powered education",
    "content authoring",
    "quiz maker",
    "exam creator",
    "learning material generator",
    "courseai"
  ],
  canonical: '/dashboard/explore',
  type: 'website',
});

export default function ExplorePage() {
  // Schema.org structured data for FAQs
  const faqSchema = {
    mainEntity: [
      {
        "@type": "Question",
        name: "How does CourseAI generate educational content?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CourseAI uses advanced artificial intelligence to analyze your topic and generate high-quality educational content including multiple-choice questions, open-ended questions, fill-in-the-blank exercises, and complete courses."
        }
      },
      {
        "@type": "Question",
        name: "Can I create programming quizzes with CourseAI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! CourseAI specializes in creating programming-related educational content. You can generate coding MCQs, algorithm challenges, code completion exercises, and debugging questions for languages including JavaScript, Python, Java, C++, and many others."
        }
      },
      {
        "@type": "Question",
        name: "How accurate is the AI-generated content?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CourseAI's content generation is highly accurate, especially for technical and programming topics. However, we always recommend reviewing AI-generated content before publishing. Our tools allow you to easily edit and refine the generated content to ensure it meets your specific requirements."
        }
      },
      {
        "@type": "Question",
        name: "Can I customize the difficulty level of generated questions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CourseAI allows you to specify the difficulty level (beginner, intermediate, advanced) for all generated content. This ensures the questions and exercises match your audience's knowledge level and learning objectives."
        }
      },
    ],
  };

  return (
    <>
      <JsonLD type="FAQPage" data={faqSchema} />
      <PageWrapper>
        <PageHeader
          title="Explore AI-Powered Content Creation"
          description="Create professional-quality educational content in minutes with our AI tools. "
        />

        <CreateComponent />
      </PageWrapper>
    </>
  );
}
