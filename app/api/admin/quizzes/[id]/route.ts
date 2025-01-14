import { NextResponse } from "next/server"

import { isAdmin, unauthorized } from "@/lib/authOptions"
import { prisma } from "@/lib/db"



export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await isAdmin())) {
    return unauthorized()
  }

  try {
    const { id } = params
    await prisma.courseQuiz.delete({
      where: { id: parseInt(id) },
    })
    return NextResponse.json({ message: "Quiz deleted successfully" })
  } catch (error) {
    console.error("Failed to delete quiz:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

