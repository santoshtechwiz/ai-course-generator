import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const createNoteSchema = z.object({
  courseId: z.number(),
  chapterId: z.number().optional(),
  note: z.string().min(1, "Note content is required"),
  title: z.string().optional(),
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
      note: {
        not: null,
      },
    }

    if (courseId) {
      where.courseId = parseInt(courseId)
    }

    if (chapterId) {
      where.chapterId = parseInt(chapterId)
    }

    const [notes, total] = await Promise.all([
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
      notes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json(
      { error: "Failed to fetch notes" },
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

    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)

    const note = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        courseId: validatedData.courseId,
        chapterId: validatedData.chapterId || null,
        note: validatedData.note,
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

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Error creating note:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}
