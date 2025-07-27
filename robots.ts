import { MetadataRoute } from "next";


export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/account',
          '/dashboard/admin',
          '/dashboard/token-success',
          '/dashboard/cancelled',
          '/dashboard/success',
          '/dashboard/unsubscribed',
          '/api/',
          '/api/*',
        ],
      },
    ],
    sitemap: 'https://courseai.io/sitemap.xml',
  }
}

