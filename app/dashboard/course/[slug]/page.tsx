import type { Metadata } from "next"
import { generateCourseMetadata, JsonLD, CourseSchema } from "@/lib/seo-manager"
import { getCourseData } from "@/app/actions/getCourseData"
import { notFound } from "next/navigation"
import type { FullCourseType } from "@/app/types/types"
import EnhancedCourseLayout from "./components/EnhancedCourseLayout"

type CoursePageParams = {
  params: Promise<{ slug: string }>
}

// Generate metadata for the course page with improved typing
export async function generateMetadata({ params }: CoursePageParams): Promise<Metadata> {
  const { slug } = await params
  const course = (await getCourseData(slug)) as FullCourseType | null
  return generateCourseMetadata(course, slug)
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
        name={course.title}
        description={course.description || ""}
        url={`${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`}
        provider={{ name: "AI Learning Platform", url: process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io" }}
        imageUrl={course.image || `/api/og?title=${encodeURIComponent(course.title)}`}
        dateCreated={course.createdAt}
        dateModified={course.updatedAt}
        educationalLevel={course.difficulty}
        timeRequired={`PT${course.estimatedTime || 5}H`}
        about={course.category?.name ? { name: course.category.name } : undefined}
        offers={offers}
        hasCourseInstance={hasCourseInstance}
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
