import type React from "react"

interface CourseSchemaProps {
  course: {
    title: string
    description: string
    image?: string
    createdAt: string
    updatedAt?: string
    instructor?: {
      name: string
      url: string
    }
  }
}

const CourseSchema: React.FC<CourseSchemaProps> = ({ course }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "CourseAI",
      sameAs: process.env.NEXT_PUBLIC_SITE_URL,
    },
    dateCreated: course.createdAt,
    dateModified: course.updatedAt || course.createdAt,
    ...(course.image && { image: course.image }),
    ...(course.instructor && {
      instructor: {
        "@type": "Person",
        name: course.instructor.name,
        url: course.instructor.url,
      },
    }),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
}

export default CourseSchema

