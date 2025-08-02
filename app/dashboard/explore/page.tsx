
import { CreateComponent } from "@/components/features/explore/CreateComponent";
import type { Metadata } from "next";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { generateMetadata } from "@/lib/seo";
import { FAQSchema } from "@/lib/seo";

// Enhanced metadata for better SEO
export const metadata: Metadata = generateMetadata({
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
  // FAQ items for CourseAI explore page
  const faqItems = [
    {
      question: "How does CourseAI generate educational content?",
      answer: "CourseAI uses advanced artificial intelligence to analyze your topic and generate high-quality educational content including multiple-choice questions, open-ended questions, fill-in-the-blank exercises, and complete courses."
    },
    {
      question: "Can I create programming quizzes with CourseAI?",
      answer: "Yes! CourseAI specializes in creating programming-related educational content. You can generate coding MCQs, algorithm challenges, code completion exercises, and debugging questions for languages including JavaScript, Python, Java, C++, and many others."
    },
    {
      question: "How accurate is the AI-generated content?",
      answer: "CourseAI's content generation is highly accurate, especially for technical and programming topics. However, we always recommend reviewing AI-generated content before publishing. Our tools allow you to easily edit and refine the generated content to ensure it meets your specific requirements."
    },
    {
      question: "Can I customize the difficulty level of generated questions?",
      answer: "CourseAI allows you to specify the difficulty level (beginner, intermediate, advanced) for all generated content. This ensures the questions and exercises match your audience's knowledge level and learning objectives."
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
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
