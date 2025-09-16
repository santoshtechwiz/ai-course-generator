import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

// NOTE: "timestamp" was previously accepted but the Bookmark model has no such column.
// Removing it prevents Prisma validation errors when null/undefined is passed.
const createBookmarkSchema = z.object({
  courseId: z.coerce.number().int().positive().optional(),
  chapterId: z.coerce.number().int().positive().optional(),
  note: z.string().trim().max(2000).optional(),
}).refine(
  (data) => data.courseId !== undefined || data.chapterId !== undefined,
  { message: "Either courseId or chapterId must be provided", path: ["courseId"] }
)

const updateBookmarkSchema = z.object({
  note: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const chapterId = searchParams.get("chapterId")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {
      userId: session.user.id,
    }

    if (courseId) {
      where.courseId = parseInt(courseId)
    }

    if (chapterId) {
      where.chapterId = parseInt(chapterId)
    }

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            }
          },
          chapter: {
            select: {
              id: true,
              title: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.bookmark.count({ where }),
    ])

    return NextResponse.json({
      bookmarks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("Error fetching bookmarks:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const raw = await request.json()
    // Sanitize: convert empty strings to undefined
    const body = {
      courseId: raw.courseId === '' ? undefined : raw.courseId,
      chapterId: raw.chapterId === '' ? undefined : raw.chapterId,
      note: typeof raw.note === 'string' && raw.note.trim().length ? raw.note : undefined,
    }
    const validatedData = createBookmarkSchema.parse(body)

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        courseId: validatedData.courseId || null,
        chapterId: validatedData.chapterId || null,
        note: validatedData.note || null,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        },
        chapter: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    console.error("Error creating bookmark:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    )
  }
}
