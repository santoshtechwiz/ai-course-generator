export const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Learning Path",
      item: `/dashboard/dashboard`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Quizzes",
      item: `/dashboard/quizzes`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Courses",
      item: `/dashboard`,
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "Create",
      item: `/dashboard/explore`,
    },
    {
      "@type": "ListItem",
      position: 6,
      name: "Membership",
      item: `/dashboard/subscription`,
    },
  ],
}

