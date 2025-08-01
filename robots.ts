import { MetadataRoute } from "next";

// robots.ts for CourseAI - AI-powered Educational Content Creator
// Comprehensive robots.txt configuration for optimal SEO crawling

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://courseai.io';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/account*',
          '/dashboard/admin*',
          '/dashboard/token-success*',
          '/dashboard/cancelled*',
          '/dashboard/success*',
          '/dashboard/unsubscribed*',
          '/api/*',
          '/_next/static/*',
          '/auth/*',
          '/tmp/*',
          '/*.json$',
          '/*?*utm_*',
          '/*?*ref=*',
          '/search?*',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/dashboard/account*',
          '/dashboard/admin*',
          '/api/*',
          '/auth/*',
        ],
        crawlDelay: 0.5,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/dashboard/account*',
          '/dashboard/admin*',
          '/api/*',
          '/auth/*',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
      },
      {
        userAgent: 'LinkedInBot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

