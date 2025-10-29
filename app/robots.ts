import { MetadataRoute } from "next";

// robots.ts for CourseAI - AI-powered Educational Content Creator
// Optimized robots.txt configuration for maximum SEO visibility while protecting sensitive areas

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://courseai.io';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/dashboard/explore*',
          '/dashboard/create*',
          '/dashboard/course/*',
          '/dashboard/mcq*',
          '/dashboard/quiz*',
          '/dashboard/openended*',
          '/dashboard/blanks*',
          '/dashboard/code*',
          '/privacy',
          '/terms',
          '/contactus',
          '/pricing',
          '/about',
          '/blog*',
          '/help*',
          '/features*',
          '/api/og*',
          '/api/sitemap*',
        ],
        disallow: [
          // Private user areas
          '/dashboard/account*',
          '/dashboard/admin*',
          '/dashboard/home*',
          '/dashboard/subscription*',
          '/dashboard/token-success*',
          '/dashboard/cancelled*',
          '/dashboard/success*',
          '/dashboard/unsubscribed*',

          // Authentication and sensitive API routes
          '/api/auth/*',
          '/api/stripe/*',
          '/api/user/*',
          '/api/dashboard/*',
          '/api/subscription/*',
          '/api/admin/*',
          '/auth/*',

          // System files
          '/_next/static/*',
          '/_next/image/*',
          '/tmp/*',

          // Dynamic parameters and tracking
          '/*.json$',
          '/*?*utm_*',
          '/*?*ref=*',
          '/*?*fbclid=*',
          '/*?*gclid=*',
          '/search?*',

          // Quiz result pages (user-specific)
          '/dashboard/*/results*',
          '/dashboard/*/*/results*',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/dashboard/explore*',
          '/dashboard/create*',
          '/dashboard/course/*',
          '/dashboard/mcq*',
          '/dashboard/quiz*',
          '/dashboard/openended*',
          '/dashboard/blanks*',
          '/dashboard/code*',
          '/privacy',
          '/terms',
          '/contactus',
          '/pricing',
          '/about',
          '/blog*',
          '/help*',
          '/features*',
          '/api/og*',
          '/api/sitemap*',
        ],
        disallow: [
          '/dashboard/account*',
          '/dashboard/admin*',
          '/api/*',
          '/auth/*',
          '/dashboard/*/results*',
        ],
        crawlDelay: 0.5,
      },
      {
        userAgent: 'Googlebot-Mobile',
        allow: [
          '/',
          '/dashboard/explore*',
          '/dashboard/create*',
          '/dashboard/course/*',
          '/dashboard/mcq*',
          '/dashboard/quiz*',
          '/dashboard/openended*',
          '/dashboard/blanks*',
          '/dashboard/code*',
          '/privacy',
          '/terms',
          '/contactus',
          '/pricing',
          '/about',
          '/blog*',
          '/help*',
          '/features*',
          '/api/og*',
          '/api/sitemap*',
        ],
        disallow: [
          '/dashboard/account*',
          '/dashboard/admin*',
          '/api/*',
          '/auth/*',
          '/dashboard/*/results*',
        ],
        crawlDelay: 0.5,
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/dashboard/explore*',
          '/dashboard/create*',
          '/dashboard/course/*',
          '/dashboard/mcq*',
          '/dashboard/quiz*',
          '/dashboard/openended*',
          '/dashboard/blanks*',
          '/dashboard/code*',
          '/privacy',
          '/terms',
          '/contactus',
          '/pricing',
          '/about',
          '/blog*',
          '/help*',
          '/features*',
          '/api/og*',
          '/api/sitemap*',
        ],
        disallow: [
          '/dashboard/account*',
          '/dashboard/admin*',
          '/dashboard/home*',
          '/api/*',
          '/auth/*',
          '/dashboard/*/results*',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'facebookexternalhit',
        allow: '/',
        disallow: [
          '/api/*',
          '/auth/*',
          '/dashboard/account*',
          '/dashboard/admin*',
        ],
      },
      {
        userAgent: 'Twitterbot',
        allow: '/',
        disallow: [
          '/api/*',
          '/auth/*',
          '/dashboard/account*',
          '/dashboard/admin*',
        ],
      },
      {
        userAgent: 'LinkedInBot',
        allow: '/',
        disallow: [
          '/api/*',
          '/auth/*',
          '/dashboard/account*',
          '/dashboard/admin*',
        ],
      },
      {
        userAgent: 'WhatsApp',
        allow: '/',
        disallow: [
          '/api/*',
          '/auth/*',
          '/dashboard/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

