

import { Course, Quiz } from "@/app/types";

const BASE_URL = process.env.NEXTAUTH_URL;

export function generateSitemapXml(courses: Course[], quizzes: Quiz[]): string {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  ${courses.map(course => `
  <url>
    <loc>${BASE_URL}/dashboard/course/${course.slug}</loc>
    <lastmod>${course?.createdAt ? course.createdAt.toISOString() : ''}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  `).join('')}
  ${quizzes.map(quiz => `
  <url>
    <loc>${BASE_URL}/dashboard/${quiz.gameType==='open_ended'?'openended':'mcq'}/${quiz.slug}</loc>
    <lastmod>${quiz?.createdAt ? quiz.createdAt.toISOString() : ''}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  `).join('')}
</urlset>`;

  return sitemap;
}
