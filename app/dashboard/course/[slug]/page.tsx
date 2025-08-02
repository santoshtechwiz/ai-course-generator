import type { Metadata } from "next"

import { getCourseData } from "@/app/actions/getCourseData"
import { notFound } from "next/navigation"
import type { FullCourseType } from "@/app/types/types"
import EnhancedCourseLayout from "./components/EnhancedCourseLayout"
import { 
  generateEnhancedMetadata, 
  EnhancedCourseSchemaComponent,
  EnhancedBreadcrumbSchemaComponent,
  type EnhancedCourseData
} from "@/lib/seo/enhanced-seo-system-v2"
import type { BreadcrumbItem } from "@/lib/seo/seo-schema"

type CoursePageParams = {
  params: Promise<{ slug: string }>
}

// Generate enhanced metadata for the course page with better SEO
export async function generateMetadata({ params }: CoursePageParams): Promise<Metadata> {
  const { slug } = await params
  const course = (await getCourseData(slug)) as FullCourseType | null
  
  if (!course) {
    return generateEnhancedMetadata({
      title: 'Course Not Found | AI Learning Platform',
      description: 'The requested course could not be found. Explore our other AI-powered educational content and interactive learning experiences.',
      noIndex: true,
      noFollow: true,
    });
  }

  // Extract keywords from course content
  const categoryName = course.category && typeof course.category === 'object' && 'name' in course.category 
    ? course.category.name 
    : (typeof course.category === 'string' ? course.category : 'programming');
    
  // Enhanced keywords with more relevant terms
  const keywords = [
    'ai course',
    'online learning',
    'interactive education',
    'video tutorials',
    'educational technology',
    course.title.toLowerCase(),
    ...(course.description ? course.description.split(' ').slice(0, 5).map(word => word.toLowerCase()) : []),
    categoryName.toLowerCase(),
    'interactive quiz',
    'courseai',
    'learning platform',
    'skill development',
    'professional training',
    'e-learning',
    'digital education'
  ].filter(Boolean);

  // Enhanced description with more appeal
  const enhancedDescription = course.description 
    ? `${course.description} | Interactive AI-powered learning with video tutorials, quizzes, and hands-on exercises. Join thousands of learners advancing their skills in ${categoryName}.`
    : `Master ${course.title} with our comprehensive AI-powered course featuring interactive content, video tutorials, and practical exercises. Perfect for ${categoryName} enthusiasts and professionals.`;

  return generateEnhancedMetadata({
    title: `${course.title} | AI Learning Platform - Interactive Course`,
    description: enhancedDescription,
    keywords,
    canonical: `/dashboard/course/${course.slug}`,
    type: 'article',
    image: course.image || `/api/og?title=${encodeURIComponent(course.title)}&category=${encodeURIComponent(categoryName)}`,
    publishedTime: course.createdAt,
    modifiedTime: course.updatedAt,
  });
}

export default async function Page({ params }: CoursePageParams) {
  const { slug } = await params
  const course = await getCourseData(slug)

  if (!course) {
    notFound()
  }

  // Extract category name for enhanced SEO
  const categoryName = course.category && typeof course.category === 'object' && 'name' in course.category 
    ? course.category.name 
    : (typeof course.category === 'string' ? course.category : 'programming');

  // Prepare enhanced course data for schema with proper hasCourseInstance
  const enhancedCourseData: EnhancedCourseData = {
    title: course.title,
    description: course.description || `Comprehensive ${categoryName} course with interactive AI-powered content, video tutorials, and hands-on exercises.`,
    slug: course.slug,
    image: course.image || `/api/og?title=${encodeURIComponent(course.title)}&category=${encodeURIComponent(categoryName)}`,
    difficulty: 'Beginner' as const,
    category: categoryName,
    createdAt: course.createdAt || new Date().toISOString(),
    updatedAt: course.updatedAt,
    estimatedHours: 10,
    price: 0,
    currency: 'USD',
    chapters: course.courseUnits?.map((unit: any, index: number) => ({
      title: unit.title || `Module ${index + 1}`,
      description: unit.description || `Learn about ${unit.title || 'this module'}`
    })) || [
      { title: `Introduction to ${course.title}`, description: `Getting started with ${course.title}` },
      { title: `Core Concepts`, description: `Understanding the fundamentals` },
      { title: `Practical Applications`, description: `Hands-on exercises and projects` },
      { title: `Advanced Topics`, description: `Deep dive into advanced concepts` }
    ],
    skills: [
      `${course.title} fundamentals`,
      `${categoryName} best practices`,
      'Practical implementation skills',
      'Real-world project development'
    ],
    prerequisites: ['Basic computer knowledge', 'Internet access'],
    authorName: 'CourseAI Instructor',
    authorUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/instructors`,
  };

  return (
    <>
      {/* Enhanced structured data with REQUIRED hasCourseInstance field */}
      <EnhancedCourseSchemaComponent course={enhancedCourseData} />
      
      {/* Breadcrumb Schema for better navigation */}
      <EnhancedBreadcrumbSchemaComponent
        path={`/dashboard/course/${course.slug}`}
        customItems={[
          { position: 1, name: "Home", url: process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io" },
          { position: 2, name: "Dashboard", url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard` },
          { position: 3, name: "Courses", url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/courses` },
          { position: 4, name: course.title, url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}` }
        ]}
      />
      
      <EnhancedCourseLayout course={course as FullCourseType} />
    </>
  )
}
