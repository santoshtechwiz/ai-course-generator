import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // Fetch all public courses
  const courses = await prisma.course.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true },
  })

  // Fetch all public quizzes
  const quizzes = await prisma.userQuiz.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true, quizType: true },
  })

  // Static pages
  const staticPages = [
    { url: "/", priority: 1.0, changefreq: "weekly" },
    { url: "/dashboard", priority: 0.9, changefreq: "daily" },
    { url: "/dashboard/explore", priority: 0.8, changefreq: "daily" },
    { url: "/dashboard/quizzes", priority: 0.8, changefreq: "daily" },
    { url: "/dashboard/account", priority: 0.7, changefreq: "weekly" },
    { url: "/dashboard/subscription", priority: 0.7, changefreq: "weekly" },
    { url: "/contactus", priority: 0.6, changefreq: "monthly" },
    { url: "/privacy", priority: 0.5, changefreq: "monthly" },
    { url: "/terms", priority: 0.5, changefreq: "monthly" },
  ]

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
  `,
    )
    .join("")}
  ${courses
    .map(
      (course) => `
  <url>
    <loc>${baseUrl}/dashboard/course/${course.slug}</loc>
    <lastmod>${course.updatedAt ? new Date(course.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  `,
    )
    .join("")}
  ${quizzes
    .map(
      (quiz) => `
  <url>
    <loc>${baseUrl}/dashboard/${quiz.quizType}/${quiz.slug}</loc>
    <lastmod>${quiz.updatedAt ? new Date(quiz.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  `,
    )
    .join("")}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}

