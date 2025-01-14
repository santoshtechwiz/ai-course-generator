import { generateSitemapXml } from '@/lib/sitemap';
import { getCourses } from '@/lib/sitemapquery';
import { NextResponse } from 'next/server'



export async function GET() {
  const courses = await getCourses();
  const sitemap = generateSitemapXml(courses)

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}

