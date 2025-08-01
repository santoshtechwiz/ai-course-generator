import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

function escapeXml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  const courses = await prisma.course.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true, createdAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 1000, // Limit for performance
  })

  const quizzes = await prisma.userQuiz.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true, quizType: true, createdAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 1000, // Limit for performance
  })

  const staticPages = [
    { url: "/", priority: 1.0, changefreq: "weekly" },
    { url: "/dashboard/explore", priority: 0.95, changefreq: "daily" },
    { url: "/dashboard/quizzes", priority: 0.9, changefreq: "daily" },
    { url: "/dashboard/courses", priority: 0.9, changefreq: "daily" },
    { url: "/dashboard/create", priority: 0.8, changefreq: "daily" },
    { url: "/dashboard/flashcard", priority: 0.7, changefreq: "weekly" },
    { url: "/contactus", priority: 0.6, changefreq: "monthly" },
    { url: "/privacy", priority: 0.4, changefreq: "yearly" },
    { url: "/terms", priority: 0.4, changefreq: "yearly" },
    { url: "/about", priority: 0.6, changefreq: "monthly" },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${escapeXml(baseUrl + page.url)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join("")}
  ${courses
    .map(
      (course) => `
  <url>
    <loc>${escapeXml(`${baseUrl}/dashboard/course/${course.slug}`)}</loc>
    <lastmod>${new Date(course.updatedAt || course.createdAt || new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("")}
  ${quizzes
    .map((quiz) => {
      const cleanedSlug = quiz.slug.replace(/-[a-z0-9]{4,}$/i, "")
      return `
  <url>
    <loc>${escapeXml(`${baseUrl}/dashboard/${quiz.quizType}/${cleanedSlug}`)}</loc>
    <lastmod>${new Date(quiz.updatedAt || quiz.createdAt || new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    })
    .join("")}
</urlset>`

  return new NextResponse(sitemap.trim(), {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}
