import type { Metadata } from "next"

import { getCourseData } from "@/app/actions/getCourseData"
import { notFound } from "next/navigation"
import type { FullCourseType } from "@/app/types/types"
import EnhancedCourseLayout from "./components/EnhancedCourseLayout"
import { CourseSchema } from "@/lib/seo/components"
import { generateOptimizedMetadata } from "@/lib/seo"

type CoursePageParams = {
  params: Promise<{ slug: string }>
}

// Generate enhanced metadata for the course page with better SEO
export async function generateMetadata({ params }: CoursePageParams): Promise<Metadata> {
  const { slug } = await params
  const course = (await getCourseData(slug)) as FullCourseType | null
  
  if (!course) {
    return generateOptimizedMetadata({
      title: 'Course Not Found',
      description: 'The requested course could not be found. Explore our other AI-powered educational content.',
      noIndex: true,
      noFollow: true,
    });
  }

  // Extract keywords from course content
  const categoryName = course.category && typeof course.category === 'object' && 'name' in course.category 
    ? course.category.name 
    : (typeof course.category === 'string' ? course.category : 'programming');
    
  const keywords = [
    'ai course',
    'online learning',
    'educational content',
    course.title.toLowerCase(),
    ...(course.description ? course.description.split(' ').slice(0, 3) : []),
    categoryName.toLowerCase(),
    'interactive quiz',
    'courseai'
  ].filter(Boolean);

  return generateOptimizedMetadata({
    title: course.title,
    description: course.description || `Learn ${course.title} with interactive AI-powered course content, quizzes, and assessments.`,
    keywords,
    canonical: `/dashboard/course/${course.slug}`,
    type: 'article',
    image: course.image,
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

  // Prepare offers and hasCourseInstance for schema.org
  const offers = {
    price: "0",
    priceCurrency: "USD",
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`,
    availability: "https://schema.org/InStock"
  };
  const hasCourseInstance = {
    name: course.title,
    description: course.description,
    courseMode: "online",
    startDate: course.createdAt,
    endDate: course.updatedAt,
    location: {
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`
    }
  };

  return (
    <>
  
      <CourseSchema
        courseName={course.title}
        description={course.description || ""}
        courseUrl={`${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`}
        provider="AI Learning Platform"
        imageUrl={course.image || `/api/og?title=${encodeURIComponent(course.title)}`}
        dateCreated={course.createdAt}
        dateModified={course.updatedAt}
      />
      <EnhancedCourseLayout 
        course={course} 
        breadcrumbs={[
          { label: course.category?.name || "Category", href: `/dashboard/category/${course.category || ""}` }
        ]}
      />
    </>
  )
}
