import { isAdmin, unauthorized } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"


export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!(await isAdmin())) {
    return unauthorized()
  }

  try {
    const { id } = params
    await prisma.course.delete({
      where: { id: parseInt(id) },
    })
    return NextResponse.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Failed to delete course:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

