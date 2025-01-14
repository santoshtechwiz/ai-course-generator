import { isAdmin, unauthorized } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"


export async function GET() {
  if (!(await isAdmin())) {
    return unauthorized()
  }

  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        isPublic: true,
      },
    })
    return NextResponse.json(courses)
  } catch (error) {
    console.error("Failed to fetch courses:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return unauthorized()
  }

  try {
    const { name, description, image, isPublic } = await request.json()
    const newCourse = await prisma.course.create({
      data: {
        name,
        description,
        image,
        isPublic: isPublic || false,
        userId: "admin", // You might want to use the actual admin user's ID here
      },
    })
    return NextResponse.json(newCourse)
  } catch (error) {
    console.error("Failed to create course:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

