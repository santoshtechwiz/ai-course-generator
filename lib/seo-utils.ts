/**
 * Helper functions for SEO optimization
 */

/**
 * Generates a canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Creates a structured breadcrumb schema for JSON-LD
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]): any {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Creates a structured course schema for course pages
 */
export function generateCourseSchema({
  name,
  description,
  provider,
  url,
  imageUrl,
  instructorName,
  instructorUrl,
  dateCreated,
  dateModified,
}: {
  name: string
  description: string
  provider: string
  url: string
  imageUrl: string
  instructorName: string
  instructorUrl: string
  dateCreated: string
  dateModified?: string
}): any {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: name,
    description: description,
    provider: {
      "@type": "Organization",
      name: provider,
      sameAs: process.env.NEXT_PUBLIC_SITE_URL,
    },
    url: url,
    image: imageUrl,
    instructor: {
      "@type": "Person",
      name: instructorName,
      url: instructorUrl,
    },
    dateCreated: dateCreated,
    dateModified: dateModified || dateCreated,
  }
}

/**
 * Creates a structured quiz schema for quiz pages
 */
export function generateQuizSchema({
  name,
  description,
  url,
  numberOfQuestions,
  timeRequired,
  educationalLevel,
}: {
  name: string
  description: string
  url: string
  numberOfQuestions: number
  timeRequired: string
  educationalLevel?: string
}): any {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: name,
    description: description,
    url: url,
    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "educationalLevel",
      targetName: educationalLevel || "All levels",
    },
    timeRequired: timeRequired,
    numberOfQuestions: numberOfQuestions,
  }
}

/**
 * Creates a structured FAQ schema for FAQ pages
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): any {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

/**
 * Optimizes image alt text for SEO
 */
export function optimizeImageAlt(alt: string, keywords: string[] = []): string {
  // If alt text is empty, use keywords
  if (!alt && keywords.length > 0) {
    return `Image about ${keywords.slice(0, 3).join(", ")}`
  }

  // If alt text doesn't contain any keywords, consider adding one
  if (alt && keywords.length > 0) {
    const hasKeyword = keywords.some((keyword) => alt.toLowerCase().includes(keyword.toLowerCase()))

    if (!hasKeyword) {
      // Only add a keyword if the alt text is short
      if (alt.length < 50) {
        return `${alt} - ${keywords[0]}`
      }
    }
  }

  return alt
}

/**
 * Generates meta tags for a specific page
 */
export function generatePageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage,
  ogType = "website",
}: {
  title: string
  description: string
  path: string
  keywords?: string[]
  ogImage?: string
  ogType?: "website" | "article"
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
  const imageUrl = ogImage || `${baseUrl}/og-image.jpg`

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url,
      type: ogType,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  }
}

/**
 * Generates a sitemap XML string from courses and quizzes data
 */
export function generateSitemapXml(courses: any[], quizzes: any[]): string {
  // Generate XML content
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  // Add static pages
  const staticPages = [
    { path: "", priority: "1.0", changefreq: "daily" },
    { path: "/dashboard", priority: "0.9", changefreq: "daily" },
    { path: "/dashboard/explore", priority: "0.8", changefreq: "weekly" },
    { path: "/dashboard/quiz", priority: "0.8", changefreq: "weekly" },
    { path: "/dashboard/quizzes", priority: "0.8", changefreq: "weekly" },
    { path: "/contactus", priority: "0.6", changefreq: "monthly" },
    { path: "/privacy", priority: "0.5", changefreq: "yearly" },
    { path: "/terms", priority: "0.5", changefreq: "yearly" },
  ]

  staticPages.forEach((page) => {
    xml += "  <url>\n"
    xml += `    <loc>${getCanonicalUrl(page.path)}</loc>\n`
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`
    xml += `    <priority>${page.priority}</priority>\n`
    xml += "  </url>\n"
  })

  // Add course pages
  courses.forEach((course) => {
    xml += "  <url>\n"
    xml += `    <loc>${getCanonicalUrl(`/dashboard/course/${course.slug}`)}</loc>\n`
    xml += `    <lastmod>${new Date(course.updatedAt || course.createdAt).toISOString()}</lastmod>\n`
    xml += "    <changefreq>weekly</changefreq>\n"
    xml += "    <priority>0.7</priority>\n"
    xml += "  </url>\n"
  })

  // Add quiz pages
  quizzes.forEach((quiz) => {
    xml += "  <url>\n"
    xml += `    <loc>${getCanonicalUrl(`/dashboard/quiz/${quiz.slug}`)}</loc>\n`
    xml += `    <lastmod>${new Date(quiz.updatedAt || quiz.createdAt).toISOString()}</lastmod>\n`
    xml += "    <changefreq>weekly</changefreq>\n"
    xml += "    <priority>0.7</priority>\n"
    xml += "  </url>\n"
  })

  xml += "</urlset>"

  return xml
}

