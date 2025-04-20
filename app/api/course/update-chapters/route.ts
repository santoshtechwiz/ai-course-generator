import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/authOptions"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { Prisma } from "@prisma/client"

// Define validation schema
const chapterSchema = z.object({
  id: z.number().nullable(), // null for new chapters
  title: z.string().min(1, "Chapter title is required"),
  videoId: z.string().nullable(),
  unitId: z.number(),
  position: z.number(), // This will map to the 'order' field in the database
  isCustom: z.boolean().optional(),
  youtubeSearchQuery: z.string().optional(),
})

const unitSchema = z.object({
  id: z.number(),
  chapters: z.array(chapterSchema),
})

const updateChaptersSchema = z.object({
  courseId: z.number(),
  slug: z.string(),
  units: z.array(unitSchema),
})

export async function POST(req: Request) {
  try {
    // Authenticate user
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()

    try {
      var validatedData = updateChaptersSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            details: validationError.errors,
          },
          { status: 400 },
        )
      }
      throw validationError
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      select: { userId: true },
    })

    if (!course || course.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to this course" }, { status: 403 })
    }

    // Process each unit and its chapters
    try {
      await prisma.$transaction(async (tx) => {
        for (const unit of validatedData.units) {
          // Process chapters for this unit
          for (const [index, chapter] of unit.chapters.entries()) {
            if (chapter.id) {
              // Update existing chapter
              await tx.chapter.update({
                where: { id: chapter.id },
                data: {
                  title: chapter.title,
                  videoId: chapter.videoId,
                  order: index, // Use the existing 'order' field instead of 'position'
                  youtubeSearchQuery: chapter.youtubeSearchQuery || chapter.title,
                  // Add isCustom field if it exists in your schema
                  // If not, you can track custom chapters by setting a flag in the summary field
                  summary: chapter.isCustom ? `Custom chapter: ${chapter.title}` : null,
                },
              })
            } else {
              // Create new chapter
              await tx.chapter.create({
                data: {
                  title: chapter.title,
                  videoId: chapter.videoId,
                  unitId: unit.id,
                  order: index, // Use the existing 'order' field
                  youtubeSearchQuery: chapter.youtubeSearchQuery || chapter.title,
                  videoStatus: chapter.videoId ? "completed" : "idle",
                  // Mark as custom chapter in the summary field if isCustom doesn't exist
                  summary: "Custom chapter created by user",
                  summaryStatus: "COMPLETED", // Set appropriate status
                },
              })
            }
          }
        }
      })
    } catch (dbError) {
      // Handle specific database errors
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        if (dbError.code === "P2025") {
          return NextResponse.json(
            {
              error: "Record not found",
              details: "The chapter or unit you're trying to update doesn't exist",
            },
            { status: 404 },
          )
        }
        if (dbError.code === "P2002") {
          return NextResponse.json(
            {
              error: "Unique constraint violation",
              details: "A duplicate entry was detected",
            },
            { status: 409 },
          )
        }
      }
      throw dbError
    }

    return NextResponse.json({
      success: true,
      message: "Course chapters updated successfully",
      slug: validatedData.slug,
    })
  } catch (error) {
    console.error("Error updating course chapters:", error)

    return NextResponse.json(
      {
        error: "Failed to update course chapters",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
