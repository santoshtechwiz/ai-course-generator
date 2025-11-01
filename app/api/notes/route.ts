import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const createNoteSchema = z.object({
  courseId: z.number(),
  chapterId: z.number().optional(),
  note: z.string()
    .min(1, "Note content is required")
    .refine((note) => !note.includes(" - "), {
      message: "Note content cannot contain course or chapter information. Please enter your own notes."
    })
    .refine((note) => !note.includes("Introduction to"), {
      message: "Note content cannot contain course titles. Please enter your own notes."
    })
    .refine((note) => !note.includes("Bookmark at "), {
      message: "Note content cannot contain automatic bookmark information. Please enter your own notes."
    })
    .refine((note) => !note.includes("Chapter "), {
      message: "Note content cannot contain chapter information. Please enter your own notes."
    })
    .refine((note) => !/^\d{1,2}:\d{2}(:\d{2})?$/.test(note.trim()), {
      message: "Note content cannot be just a timestamp. Please enter your own notes."
    })
    .refine((note) => note.trim().length >= 5, {
      message: "Note content must be at least 5 characters long"
    }),
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
        notIn: [""], // Exclude empty notes
      },
      // Filter out notes that look like course/chapter titles with timestamps
      // These are likely invalid notes created by mistake
      NOT: [
        {
          note: {
            contains: " - ", // Exclude notes that contain " - " pattern (course - timestamp)
          }
        },
        {
          note: {
            contains: "Introduction to", // Exclude notes that start with course titles
          }
        },
        {
          note: {
            contains: "Bookmark at ", // Exclude automatic bookmark timestamps
          }
        },
        {
          note: {
            contains: "Chapter ", // Exclude chapter references
          }
        }
      ]
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

    // Check note limit (max 5 notes per user per course)
    const existingNotesCount = await prisma.bookmark.count({
      where: {
        userId: session.user.id,
        courseId: validatedData.courseId,
        note: {
          not: null,
        },
        NOT: [
          {
            note: {
              contains: " - ", // Exclude bookmarks that look like course/chapter info
            }
          },
          {
            note: {
              contains: "Introduction to", // Exclude bookmarks that start with course titles
            }
          }
        ]
      }
    })

    if (existingNotesCount >= 5) {
      return NextResponse.json(
        { error: "Note limit reached. You can only have up to 5 notes per course." },
        { status: 400 }
      )
    }

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
