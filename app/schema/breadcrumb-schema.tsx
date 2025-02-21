export const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Quiz Generator",
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/quiz-generator`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Course Creator",
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/course-creator`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Question Bank",
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/question-bank`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Analytics",
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/analytics`,
      },
    ],
  }
  
  