import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { formatApiResponse, formatApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/db" // Adjust the path based on your project structure

// GET /api/admin/email/sample-data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.isAdmin !== true) {
      return formatApiError("Unauthorized", 401)
    }

    const [courses, quizzes] = await Promise.all([
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          image: true,
        },
        take: 3,
      }),
      prisma.userQuiz.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          quizType: true,
          difficulty: true,
         
        },
        take: 3,
      }),
    ])

    return formatApiResponse({ courses, quizzes })
  } catch (error) {
    console.error("Error fetching sample data:", error)
    return formatApiError("Failed to fetch sample data")
  }
}
