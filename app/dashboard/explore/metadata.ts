import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";

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
