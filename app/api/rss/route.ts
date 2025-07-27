import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  const quizzes = await prisma.userQuiz.findMany({
    where: { isPublic: true },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      slug: true,
      title: true,
     
      updatedAt: true,
      quizType: true,
    },
  })

  const items = quizzes
    .map((quiz) => {
      const cleanedSlug = quiz.slug.replace(/-[a-z0-9]{4,}$/i, "")
      const url = `${baseUrl}/dashboard/${quiz.quizType}/${quiz.slug}`
      const description = quiz.title || "Interactive coding quiz"
      return `
  <item>
    <title>${escapeXml(quiz.title || cleanedSlug)}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <description>${escapeXml(description)}</description>
    <pubDate>${new Date(quiz.updatedAt).toISOString()}</pubDate>
  </item>`
    })
    .join("")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>CourseAI – Latest Quizzes</title>
  <link>${baseUrl}</link>
  <description>Recently added public quizzes on CourseAI</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items}
</channel>
</rss>`

  return new NextResponse(rss.trim(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=UTF-8",
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
