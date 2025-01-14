import { NextResponse } from "next/server"

import { isAdmin, unauthorized } from "@/lib/auth"
import { prisma } from "@/lib/db"


export async function GET() {
  if (!(await isAdmin())) {
    return unauthorized()
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      
        credits: true,
      },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error("Failed to fetch users:", error)
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
    const { name, email, isAdmin, credits } = await request.json()
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        isAdmin: isAdmin || false,
        credits: credits || 0,
      },
    })
    return NextResponse.json(newUser)
  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

