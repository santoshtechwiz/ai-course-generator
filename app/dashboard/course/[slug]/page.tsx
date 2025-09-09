import type { Metadata } from "next"

import { getCourseData } from "@/app/actions/getCourseData"
import { notFound } from "next/navigation"
import type { FullCourseType } from "@/app/types/types"
import CourseLayout from "./components/CourseLayout"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"

type CoursePageParams = {
  params: Promise<{ slug: string }>
}

// Generate enhanced metadata for the course page with better SEO
export async function generateMetadata({ params }: CoursePageParams): Promise<Metadata> {
  const { slug } = await params
  const course = (await getCourseData(slug)) as FullCourseType | null
  
  if (!course) {
    return generateSEOMetadata({
      title: 'Course Not Found | AI Learning Platform',
      description: 'The requested course could not be found. Explore our other AI-powered educational content and interactive learning experiences.',
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

  return generateSEOMetadata({
    title: `${course.title} | AI Learning Platform - Interactive Course`,
    description: enhancedDescription,
    keywords,
    canonical: `/dashboard/course/${course.slug}`,
    type: 'article',
    image: course.image || `/api/og?title=${encodeURIComponent(course.title)}&category=${encodeURIComponent(categoryName)}`,
  });
}

export default async function Page({ params }: CoursePageParams) {
  try {
    const { slug } = await params

    if (!slug) {
      throw new Error("Course slug is required")
    }

    const course = await getCourseData(slug)
    
    if (!course) {
      notFound()
    }

    // Validate essential course data
    if (!course.title || !course.slug) {
      throw new Error("Invalid course data")
    }

    return (
      <div className="min-h-screen">
        <CourseLayout course={course as FullCourseType} />
      </div>
    )
  } catch (error) {
    console.error("Course page error:", error)
    throw error // This will be caught by the error boundary
  }
}