/**
 * Enhanced Quiz Page SEO Template
 * 
 * Example implementation for quiz pages with proper schema.org compliance
 */

import type { Metadata } from "next";
import { 
  generateEnhancedMetadata, 
  EnhancedQuizSchemaComponent,
  EnhancedBreadcrumbSchemaComponent,
  type EnhancedQuizData 
} from "@/lib/seo";

// Example function for quiz pages
export function generateQuizPageMetadata(quiz: {
  title: string;
  description?: string;
  slug: string;
  quizType: string;
  difficulty: string;
  questionsCount: number;
}): Metadata {
  const enhancedDescription = quiz.description 
    ? `${quiz.description} | Test your knowledge with ${quiz.questionsCount} ${quiz.difficulty} level questions.`
    : `Test your knowledge with our ${quiz.title} quiz. ${quiz.questionsCount} ${quiz.difficulty} level questions to challenge your understanding.`;

  return generateEnhancedMetadata({
    title: `${quiz.title} - ${quiz.quizType.toUpperCase()} Quiz | Interactive Assessment`,
    description: enhancedDescription,
    keywords: [
      quiz.title.toLowerCase(),
      `${quiz.quizType} quiz`,
      `${quiz.difficulty} level`,
      "interactive assessment",
      "online quiz",
      "skill test",
      "programming quiz",
      "courseai quiz",
    ],
    canonical: `/dashboard/${quiz.quizType}/${quiz.slug}`,
    type: "article",
  });
}

// Example component structure for quiz pages
export function QuizPageWithSEO({ 
  quiz, 
  children 
}: { 
  quiz: EnhancedQuizData; 
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Enhanced Quiz Schema with educational compliance */}
      <EnhancedQuizSchemaComponent quiz={quiz} />
      
      {/* Breadcrumb Schema for better navigation */}
      <EnhancedBreadcrumbSchemaComponent
        path={`/dashboard/${quiz.quizType}/${quiz.slug}`}
        customItems={[
          { name: "Home", url: process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io" },
          { name: "Dashboard", url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard` },
          { name: "Quizzes", url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/quiz` },
          { name: quiz.title, url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/${quiz.quizType}/${quiz.slug}` }
        ]}
      />
      
      {children}
    </>
  );
}

// Example quiz data generator
export function createEnhancedQuizData(quiz: any): EnhancedQuizData {
  return {
    title: quiz.title || "Programming Quiz",
    description: quiz.description || `Test your programming knowledge with this comprehensive ${quiz.type || 'MCQ'} quiz.`,
    slug: quiz.slug || "programming-quiz",
    quizType: quiz.type || "mcq",
    difficulty: quiz.difficulty || "medium",
    questionsCount: quiz.questions?.length || quiz.amount || 10,
    estimatedTime: quiz.timeRequired || Math.ceil((quiz.questions?.length || quiz.amount || 10) * 1.5),
    category: quiz.category || "Programming",
    createdAt: quiz.createdAt || new Date().toISOString(),
    updatedAt: quiz.updatedAt || quiz.createdAt || new Date().toISOString(),
  };
}
