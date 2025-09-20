import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const batchStatusSchema = z.object({
  courseIds: z.array(z.coerce.number().int().positive()).max(50), // Max 50 course IDs per request
})

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { courseIds } = batchStatusSchema.parse(body)

    if (!courseIds.length) {
      return NextResponse.json({})
    }

    // Single optimized query to get all bookmark statuses
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: session.user.id,
        courseId: {
          in: courseIds,
        },
      },
      select: {
        courseId: true,
      },
    })

    // Create a map of courseId -> bookmark status
    const bookmarkStatusMap: Record<number, boolean> = {}

    // Initialize all requested course IDs as false
    courseIds.forEach(courseId => {
      bookmarkStatusMap[courseId] = false
    })

    // Set bookmarked courses to true
    bookmarks.forEach(bookmark => {
      bookmarkStatusMap[bookmark.courseId] = true
    })

    return NextResponse.json(bookmarkStatusMap)
  } catch (error) {
    console.error("Error fetching batch bookmark statuses:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch bookmark statuses" },
      { status: 500 }
    )
  }
}