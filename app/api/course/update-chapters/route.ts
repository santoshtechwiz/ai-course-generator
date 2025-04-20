import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/authOptions"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Define validation schema
const chapterSchema = z.object({
  id: z.number().nullable(), // null for new chapters
  title: z.string(),
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
    const validatedData = updateChaptersSchema.parse(body)

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      select: { userId: true },
    })

    if (!course || course.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to this course" }, { status: 403 })
    }

    // Process each unit and its chapters
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

    return NextResponse.json({
      success: true,
      message: "Course chapters updated successfully",
      slug: validatedData.slug,
    })
  } catch (error) {
    console.error("Error updating course chapters:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data format", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to update course chapters" }, { status: 500 })
  }
}
