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
          '/about',
          '/contactus',
          '/blog*',
          '/features*',
          '/pricing',
          '/privacy',
          '/terms',
          '/help*',
          '/api/og*',
          '/api/sitemap*',
        ],
        disallow: [
          // Private dashboard and user areas
          '/dashboard/*',
          '/auth/*',
          '/api/*',

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
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/about',
          '/contactus',
          '/blog*',
          '/features*',
          '/pricing',
          '/privacy',
          '/terms',
          '/help*',
          '/api/og*',
          '/api/sitemap*',
        ],
        disallow: [
          '/dashboard/*',
          '/auth/*',
          '/api/*',
        ],
        crawlDelay: 0.5,
      },
      {
        userAgent: 'Googlebot-Mobile',
        allow: [
          '/',
          '/about',
          '/contactus',
          '/blog*',
          '/features*',
          '/pricing',
          '/privacy',
          '/terms',
          '/help*',
          '/api/og*',
          '/api/sitemap*',
        ],
        disallow: [
          '/dashboard/*',
          '/auth/*',
          '/api/*',
        ],
        crawlDelay: 0.5,
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/about',
          '/contactus',
          '/blog*',
          '/features*',
          '/pricing',
          '/privacy',
          '/terms',
          '/help*',
          '/api/og*',
          '/api/sitemap*',
        ],
        disallow: [
          '/dashboard/*',
          '/auth/*',
          '/api/*',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'facebookexternalhit',
        allow: [
          '/',
          '/about',
          '/contactus',
          '/blog*',
          '/features*',
          '/pricing',
        ],
        disallow: [
          '/dashboard/*',
          '/auth/*',
          '/api/*',
        ],
      },
      {
        userAgent: 'Twitterbot',
        allow: [
          '/',
          '/about',
          '/contactus',
          '/blog*',
          '/features*',
          '/pricing',
        ],
        disallow: [
          '/dashboard/*',
          '/auth/*',
          '/api/*',
        ],
      },
      {
        userAgent: 'LinkedInBot',
        allow: [
          '/',
          '/about',
          '/contactus',
          '/blog*',
          '/features*',
          '/pricing',
        ],
        disallow: [
          '/dashboard/*',
          '/auth/*',
          '/api/*',
        ],
      },
      {
        userAgent: 'WhatsApp',
        allow: [
          '/',
          '/about',
          '/contactus',
          '/blog*',
          '/features*',
          '/pricing',
        ],
        disallow: [
          '/dashboard/*',
          '/auth/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

