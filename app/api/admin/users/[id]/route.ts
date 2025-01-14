import { NextResponse } from "next/server"

import { isAdmin, unauthorized } from "@/lib/authOptions"
import { prisma } from "@/lib/db"



export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await isAdmin())) {
    return unauthorized()
  }

  try {
    const { id } = params
    const { isAdmin: newIsAdmin } = await request.json()
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin: newIsAdmin },
    })
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Failed to update user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

