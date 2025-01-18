import { generateSitemapXml } from '@/lib/sitemap';
import { getCoursesAndQuizzes } from '@/lib/sitemapquery';
import { NextResponse } from 'next/server'



export async function GET() {
  const { courses, quizzes } = await getCoursesAndQuizzes();
  const sitemap = generateSitemapXml(courses, quizzes);

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}

