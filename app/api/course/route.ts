import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { createChaptersSchema } from "@/schema/schema"
import { courseService } from "@/app/services/course.service"
import type { CategoryId } from "@/config/categories"
import { SubscriptionPlanType } from '@/types/subscription-plans'

// Cache configuration for course endpoints
const CACHE_DURATION = {
  SINGLE_COURSE: 600, // 10 minutes for single course by slug
  COURSE_LIST: 300, // 5 minutes for course listings
  USER_COURSES: 60, // 1 minute for user-specific courses
  SEARCH_RESULTS: 180, // 3 minutes for search results
}

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
        
        // Return with longer cache for single course
        return NextResponse.json(course, {
          headers: {
            'Cache-Control': `private, s-maxage=${CACHE_DURATION.SINGLE_COURSE}, stale-while-revalidate=${CACHE_DURATION.SINGLE_COURSE * 2}`,
          }
        })
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
      // Determine cache duration based on query type
      let cacheDuration = CACHE_DURATION.COURSE_LIST
      if (userId) {
        cacheDuration = CACHE_DURATION.USER_COURSES
      } else if (search) {
        cacheDuration = CACHE_DURATION.SEARCH_RESULTS
      }

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

      // Return with appropriate cache headers
      return NextResponse.json(result, {
        headers: {
          'Cache-Control': userId 
            ? `private, s-maxage=${cacheDuration}, stale-while-revalidate=${cacheDuration * 2}`
            : `public, s-maxage=${cacheDuration}, stale-while-revalidate=${cacheDuration * 2}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheDuration}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheDuration}`,
        }
      })
    } catch (error) {
      console.error("Error fetching courses:", error)
      return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
    }
  }
}

// Route handlers continue below...

export async function POST(req: Request) {
  try {
    // Check for simulation mode
    const isSimulationMode = process.env.NEXT_PUBLIC_SIMULATION_MODE === "true"
    
    if (isSimulationMode) {
      console.log("[Course API] Simulation mode enabled - returning mock course")
      
      // Parse request body to get title
      const data = await req.json()
      const parsedData = createChaptersSchema.parse(data)
      
      // Return mock course data instantly
      return NextResponse.json({
        id: "mock-course-id",
        title: parsedData.title,
        status: "draft",
        slug: `mock-${Date.now()}`
      })
    }

    // Authenticate the user
    const session = await getAuthSession()
    if (!session?.user) {
      return new NextResponse("unauthorised", { status: 401 })
    }

    // Prevent inactive users from creating courses
    if (session.user.isActive === false) {
      console.warn(`[Course API] Blocked inactive user ${session.user.id} from creating a course`)
      return NextResponse.json({ error: "Account inactive. Please contact support to re-activate." }, { status: 403 })
    }

    // Parse request body
    const data = await req.json()
    const parsedData = createChaptersSchema.parse(data)

    // Use service to create the course
    const userType = session.user?.userType || SubscriptionPlanType.FREE
    const result = await courseService.createCourse(session.user.id, parsedData, userType)
    
    // Ensure we're returning the slug in the response
    if (!result.slug) {
      console.error("Course service didn't return a slug:", result)
    }
    
    console.log("Course creation result:", result)
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
