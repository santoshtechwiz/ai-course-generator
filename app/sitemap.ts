import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://courseai.io'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/quizzes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard/create`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/dashboard/subscription`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contactus`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // Dynamic pages - Courses
    const courses = await prisma.course.findMany({
      where: { isPublic: true },
      select: { slug: true, updatedAt: true },
    })

    const coursePages: MetadataRoute.Sitemap = courses.map((course) => ({
      url: `${baseUrl}/dashboard/course/${course.slug}`,
      lastModified: course.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Dynamic pages - Quizzes
    const quizzes = await prisma.userQuiz.findMany({
      where: { isPublic: true },
      select: { slug: true, updatedAt: true, quizType: true },
    })

    const quizPages: MetadataRoute.Sitemap = quizzes.map((quiz) => {
      const cleanedSlug = quiz.slug.replace(/-[a-z0-9]{4,}$/i, '')
      return {
        url: `${baseUrl}/dashboard/${quiz.quizType}/${cleanedSlug}`,
        lastModified: quiz.updatedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    })

    return [...staticPages, ...coursePages, ...quizPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return at least static pages if database query fails
    return staticPages
  }
}
