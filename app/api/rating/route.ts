import { type NextRequest } from "next/server"
import prisma, { slugToId } from "@/lib/db"
import { withAuth } from "@/middlewares/auth-middleware"
import { ApiResponseHandler } from "@/services/api-response-handler"

export const POST = withAuth(async (req: NextRequest, session) => {
  try {
    const { type, id, rating } = await req.json()

    if (!type || !id || rating === undefined) {
      return ApiResponseHandler.validationError("Missing required fields")
    }

    let result

    if (type === "quiz") {
      result = await prisma.userQuizRating.upsert({
        where: {
          userId_userQuizId: {
            userId: session.user.id,
            userQuizId: Number.parseInt(id),
          },
        },
        update: { rating },
        create: {
          userId: session.user.id,
          userQuizId: Number.parseInt(id),
          rating,
        },
      })
    } else if (type === "course") {
      const courseId = await slugToId(id)
      result = await prisma.courseRating.upsert({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: courseId!,
          },
        },
        update: { rating },
        create: {
          userId: session.user.id,
          courseId: courseId!,
          rating,
        },
      })
    } else {
      return ApiResponseHandler.validationError("Invalid type")
    }

    return ApiResponseHandler.success({ data: result })
  } catch (error) {
    return ApiResponseHandler.error(error || "Failed to update rating")
  }
})

export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    if (!type || !id) {
      return ApiResponseHandler.validationError("Missing required fields")
    }

    let rating

    if (type === "quiz") {
      rating = await prisma.userQuizRating.findUnique({
        where: {
          userId_userQuizId: {
            userId: session.user.id,
            userQuizId: Number.parseInt(id),
          },
        },
      })
    } else if (type === "course") {
      rating = await prisma.courseRating.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: Number.parseInt(id),
          },
        },
      })
    } else {
      return ApiResponseHandler.validationError("Invalid type")
    }

    return ApiResponseHandler.success({ data: rating || 0 })
  } catch (error) {
    return ApiResponseHandler.error(error || "Failed to fetch rating")
  }
})
