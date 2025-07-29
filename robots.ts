import { MetadataRoute } from "next";

// robots.ts for CourseAI - AI-powered Courses & Quizzes for Every Topic
// Empowering everyone to create, share, and discover interactive courses and quizzes on any topic with the power of AI.

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

