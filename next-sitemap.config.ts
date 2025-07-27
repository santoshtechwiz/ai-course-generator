const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

module.exports = {
  siteUrl: 'https://courseai.io',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/dashboard/account', '/api/', '/api/*'] },
    ],
  },
  async additionalPaths(config) {
    const staticPages = [
      '/',
      '/dashboard',
      '/dashboard/quizzes',
      '/dashboard/home',
      '/dashboard/explore',
      '/dashboard/about',
      '/dashboard/privacy',
      '/dashboard/terms',
    ];

    const courses = await prisma.course.findMany({
      where: { isPublic: true },
      select: { slug: true, updatedAt: true },
    });

    const quizzes = await prisma.courseQuiz.findMany({
      where: { isPublic: true },
      select: { slug: true, updatedAt: true },
    });


    const cleanSlug = (slug: string): string => slug.replace(/-([a-zA-Z0-9]{4,})$/, '');

    const coursePaths = courses.map((c: { slug: string; updatedAt: Date }) => ({
      loc: `/dashboard/course/${cleanSlug(c.slug)}`,
      lastmod: c.updatedAt.toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
    }));

    const quizPaths = quizzes.map((q: { slug: string; updatedAt: Date }) => ({
      loc: `/dashboard/quizzes/${cleanSlug(q.slug)}`,
      lastmod: q.updatedAt.toISOString(),
      changefreq: 'weekly',
      priority: 0.7,
    }));

    const staticPaths = staticPages.map(p => ({
      loc: p,
      changefreq: 'monthly',
      priority: 0.5,
    }));

    return [
      ...staticPaths,
      ...coursePaths,
      ...quizPaths,
    ];
  },
}
