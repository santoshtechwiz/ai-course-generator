import { headers } from "next/headers";

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
 * Structured data for 404 pages following schema.org specifications
 * This helps search engines understand the page is a 404
 */
export const notFoundStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Not Found",
  "description": "The requested page could not be found.",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://courseai.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Page Not Found",
        "item": "https://courseai.com/404"
      }
    ]
  },
  "mainEntity": {
    "@type": "WebPage",
    "isPartOf": {
      "@type": "WebSite",
      "name": "CourseAI",
      "url": "https://courseai.com"
    }
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://courseai.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};
