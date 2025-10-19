import type { Metadata } from "next"

import { getCourseData } from "@/app/actions/getCourseData"
import type { FullCourseType } from "@/app/types/types"
import CourseLayout from "./components/CourseLayout"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"
import { EnhancedErrorBoundary } from "@/components/error-boundary"

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
      console.error("Course slug is missing from params")
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Course URL</h1>
            <p className="text-gray-600 mb-6">The course URL appears to be malformed.</p>
            <a
              href="/dashboard/explore"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
            >
              Browse Courses
            </a>
          </div>
        </div>
      )
    }

    const course = await getCourseData(slug)

    if (!course) {
      console.warn(`Course not found for slug: ${slug}`)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.88-5.5-2.291M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
            <p className="text-gray-600 mb-6">
              The course you're looking for doesn't exist or may have been removed.
            </p>
            <div className="space-y-3">
              <a
                href="/dashboard/explore"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 mr-3"
              >
                Browse All Courses
              </a>
              <a
                href="/dashboard/create"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Create New Course
              </a>
            </div>
          </div>
        </div>
      )
    }

    // Validate essential course data
    if (!course.title || !course.slug) {
      console.error("Invalid course data for slug:", slug, course)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Data Error</h1>
            <p className="text-gray-600 mb-6">This course appears to have incomplete data.</p>
            <a
              href="/dashboard/explore"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
            >
              Browse Courses
            </a>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen">
        <EnhancedErrorBoundary>
          <CourseLayout course={course as FullCourseType} />
        </EnhancedErrorBoundary>
      </div>
    )
  } catch (error) {
    console.error("Course page error:", error)
    // Don't throw the error - show a user-friendly error page instead
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <svg className="mx-auto h-24 w-24 text-[hsl(var(--destructive))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
          <p className="text-gray-600 mb-6">We encountered an error while loading this course.</p>
          <a
            href="/dashboard/explore"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
          >
            Browse Courses
          </a>
        </div>
      </div>
    )
  }
}