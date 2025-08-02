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

  return generateOptimizedMetadata({
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

  // Enhanced offers and course instance data for better SEO
  const offers = {
    price: "0",
    priceCurrency: "USD",
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`,
    availability: "https://schema.org/InStock",
    validFrom: course.createdAt,
    category: categoryName
  };
  
  const hasCourseInstance = {
    name: course.title,
    description: course.description || `Comprehensive ${categoryName} course with interactive content`,
    courseMode: "online",
    startDate: course.createdAt,
    endDate: course.updatedAt,
    duration: "PT10H", // Estimated 10 hours
    instructor: {
      name: "AI Learning Platform",
      description: "Expert AI-powered educational content"
    },
    location: {
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`
    },
    courseWorkload: "Self-paced learning with interactive exercises"
  };

  return (
    <>
      {/* Enhanced structured data for better SEO */}
      <CourseSchema
        courseName={course.title}
        courseUrl={`${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`}
        description={course.description || `Comprehensive ${categoryName} course with interactive AI-powered content, video tutorials, and hands-on exercises.`}
        provider="AI Learning Platform"
        providerUrl={process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}
        imageUrl={course.image || `/api/og?title=${encodeURIComponent(course.title)}&category=${encodeURIComponent(categoryName)}`}
        dateCreated={course.createdAt}
        dateModified={course.updatedAt}
        category={categoryName}
        difficulty="Beginner"
        duration="PT10H"
        language="en"
        price={0}
        currency="USD"
        learningOutcomes={[
          `Master ${course.title} fundamentals`,
          `Apply practical ${categoryName} skills`,
          'Complete hands-on projects',
          'Earn completion certificate'
        ]}
        offers={[{
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`
        }]}
      />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": {
                  "@type": "WebPage",
                  "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/`,
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/`
                }
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Dashboard",
                "item": {
                  "@type": "WebPage",
                  "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard`,
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard`
                }
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Courses",
                "item": {
                  "@type": "WebPage",
                  "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/courses`,
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/courses`
                }
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": categoryName,
                "item": {
                  "@type": "WebPage",
                  "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/category/${course.category || ""}`,
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/category/${course.category || ""}`
                }
              },
              {
                "@type": "ListItem",
                "position": 5,
                "name": course.title,
                "item": {
                  "@type": "WebPage",
                  "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`,
                  "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/dashboard/course/${course.slug}`
                }
              }
            ]
          }, null, 0)
        }}
      />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/#organization`,
            "name": "AI Learning Platform",
            "url": process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io",
            "logo": {
              "@type": "ImageObject",
              "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/logo.png`
            },
            "description": "Advanced AI-powered learning platform offering interactive courses and educational content",
            "foundingDate": "2024",
            "areaServed": "Worldwide",
            "serviceType": "Educational Technology"
          }, null, 0)
        }}
      />

      {/* WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/#website`,
            "name": "AI Learning Platform",
            "url": process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io",
            "description": "Learn with AI-powered interactive courses",
            "publisher": {
              "@id": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/#organization`
            },
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${process.env.NEXT_PUBLIC_BASE_URL || "https://courseai.io"}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          }, null, 0)
        }}
      />

      <EnhancedCourseLayout 
        course={course} 
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Courses', href: '/dashboard/courses' },
          { label: course.category?.name || "Category", href: `/dashboard/category/${course.category || ""}` },
          { label: course.title, href: `/dashboard/course/${course.slug}` }
        ]}
      />
    </>
  )
}
