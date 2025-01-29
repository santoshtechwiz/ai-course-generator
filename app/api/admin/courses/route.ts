import { isAdmin, unauthorized } from "@/lib/authOptions"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"


export async function GET() {
  

  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
      
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


