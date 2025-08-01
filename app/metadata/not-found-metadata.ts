import { Metadata } from "next"
import { generateOptimizedMetadata } from "@/lib/seo"

export const notFoundMetadata: Metadata = generateOptimizedMetadata({
  title: '404 - Page Not Found | CourseAI',
  description: 'The page you were looking for does not exist. Explore our comprehensive AI-powered educational courses, interactive quizzes, and learning materials.',
  keywords: [
    'page not found',
    'ai courses',
    'online learning',
    'educational content',
    'interactive courses',
    'courseai',
    'learning platform',
    '404 error'
  ],
  noIndex: true,
  noFollow: true,
  type: 'website',
  canonicalPath: '/404'
});
