import { NextRequest, NextResponse } from 'next/server'
import prisma, { slugToId } from "@/lib/db"
import { getAuthSession } from "@/lib/authOptions"

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { type, id, rating } = await req.json()

  if (!type || !id || rating === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    let result

    if (type === 'quiz') {
      result = await prisma.userQuizRating.upsert({
        where: {
          userId_userQuizId: {
            userId: session.user.id,
            userQuizId: parseInt(id),
          },
        },
        update: { rating },
        create: {
          userId: session.user.id,
          userQuizId: parseInt(id),
          rating,
        },
      })
    } else if (type === 'course') {
      const courseId=await slugToId(id);
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
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error updating rating:", error)
    return NextResponse.json({ error: "Failed to update rating" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!type || !id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    let rating

    if (type === 'quiz') {
      rating = await prisma.userQuizRating.findUnique({
        where: {
          userId_userQuizId: {
            userId: session.user.id,
            userQuizId: parseInt(id),
          },
        },
      })
    } else if (type === 'course') {
      rating = await prisma.courseRating.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: parseInt(id),
          },
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: rating||0 })
  } catch (error) {
    console.error("Error fetching rating:", error)
    return NextResponse.json({ error: "Failed to fetch rating" }, { status: 500 })
  }
}
