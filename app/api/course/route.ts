import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { createChaptersSchema } from "@/schema/schema"
import { courseService } from "@/app/services/course.service"
import type { CategoryId } from "@/config/categories"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || undefined
  const category = searchParams.get("category") || undefined
  const userId = searchParams.get("userId") || undefined
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
  const sortBy = searchParams.get("sortBy") || "viewCount"
  const sortOrder = searchParams.get("sortOrder") || "desc"
  const slug = searchParams.get("slug")

  // Handle single course fetch by slug
  if (slug) {
    try {
      // Authenticate user for single course fetch
      const session = await getAuthSession()
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Use service to get course by slug
      try {
        const course = await courseService.getCourseBySlug(slug)
        return NextResponse.json(course)
      } catch (error) {
        if ((error as Error).message === "Course not found") {
          return NextResponse.json({ error: "Course not found" }, { status: 404 })
        }
        throw error
      }
    } catch (error) {
      console.error("Error fetching course:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  } else {
    // Handle course listing (no slug provided)
    try {
      // Use service to get filtered courses
      const result = await courseService.getCourses({
        search,
        category,
        userId,
        page,
        limit,
        sortBy,
        sortOrder,
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error("Error fetching courses:", error)
      return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
    }
  }
}

// Route handlers continue below...

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getAuthSession()
    if (!session?.user) {
      return new NextResponse("unauthorised", { status: 401 })
    }

    // Parse request body
    const data = await req.json()
    const parsedData = createChaptersSchema.parse(data)
    console.log("Creating course with data:", { ...parsedData, units: parsedData.units.length }) // Log without full unit data

    // Use service to create the course
    const result = await courseService.createCourse(session.user.id, parsedData)
    console.log("Course created successfully with result:", result) // Debug log
    
    // Ensure we're returning the slug in the response
    if (!result.slug) {
      console.error("Course service didn't return a slug")
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error(`Course creation error: ${error.message}`)

    if (error.message === "Insufficient credits") {
      return new NextResponse("Insufficient credits", { status: 402 })
    }

    console.error("Error creating course:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create course",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { chapterId, videoId } = await req.json()

    if (!chapterId) {
      return NextResponse.json(
        {
          success: false,
          message: "Chapter ID is required",
        },
        { status: 400 },
      )
    }

    // Authenticate user
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use service to update chapter video
    try {
      const result = await courseService.updateChapterVideo(chapterId, videoId)
      return NextResponse.json(result)
    } catch (error) {
      if ((error as Error).message === "Chapter not found") {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error("Error generating video:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate video",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
