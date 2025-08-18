import { headers } from "next/dist/server/request/headers";

/**
 * Sets appropriate headers for 404 pages to ensure proper SEO handling
 * This utility can be imported and used across all not-found pages
 * to ensure consistent behavior
 */
export function setNotFoundHeaders() {
  // Next.js App Router automatically sets the status code to 404
  // when rendering not-found.tsx files, but we can add additional headers
  const headersList = headers();
  
  // For additional headers if needed in the future
  // This function can be expanded as needed
  
  return {
    headers: headersList,
    status: 404,
  };
}

/**
 * Base URL for consistent URL generation across the app
 */
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io";

/**
 * Structured data for 404 pages following schema.org specifications
 * This helps search engines understand the page is a 404
 */
export const notFoundStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Not Found",
  "description": "The requested page could not be found on CourseAI.",
  "url": `${BASE_URL}/404`,
  "isPartOf": {
    "@type": "WebSite",
    "name": "CourseAI",
    "url": BASE_URL,
    "description": "AI-powered education platform for interactive courses and quizzes"
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": BASE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Page Not Found",
        "item": `${BASE_URL}/404`
      }
    ]
  },
  "mainEntity": {
    "@type": "WebPage",
    "name": "404 Error Page",
    "description": "This page indicates that the requested resource could not be found.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "CourseAI",
      "url": BASE_URL
    },
    "errorCode": "404",
    "errorType": "Not Found"
  },
  "potentialAction": [
    {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    {
      "@type": "Action",
      "name": "Return to Home",
      "target": BASE_URL
    },
    {
      "@type": "Action", 
      "name": "Explore Courses",
      "target": `${BASE_URL}/dashboard/explore`
    }
  ]
};

/**
 * Generates course-specific not found structured data
 */
export function generateCourseNotFoundStructuredData() {
  return {
    ...notFoundStructuredData,
    "@type": "WebPage",
    "name": "Course Not Found",
    "description": "The requested course could not be found on CourseAI.",
    "url": `${BASE_URL}/dashboard/course/not-found`,
    "specialty": "Course",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": BASE_URL,
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Dashboard",
          "item": `${BASE_URL}/dashboard`,
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Courses",
          "item": `${BASE_URL}/dashboard/explore`,
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Course Not Found",
          "item": `${BASE_URL}/dashboard/course/not-found`,
        },
      ],
    },
    "mainEntity": {
      "@type": "Course",
      "name": "Requested Course",
      "description": "The course you are looking for is not available.",
      "provider": {
        "@type": "Organization",
        "name": "CourseAI",
        "url": BASE_URL
      }
    }
  };
}
