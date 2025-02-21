export const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Learning Path",
      item: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/dashboard`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Quizzes",
      item: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/quizzes`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Courses",
      item: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "Create",
      item: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/explore`,
    },
    {
      "@type": "ListItem",
      position: 6,
      name: "Membership",
      item: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/subscription`,
    },
  ],
}

