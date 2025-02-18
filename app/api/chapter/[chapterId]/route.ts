import prisma from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { chapterId: string } }) {
  const { chapterId } = params
  const { summary } = await request.json()


  try {
    const updatedChapter = await prisma.chapter.update({
      where: { id: Number(chapterId) },
      data: { summary },
    })

    return NextResponse.json(updatedChapter)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update chapter summary" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise< { chapterId: string }> }) {
  const { chapterId } =await  params
  console.log("Received DELETE request:", { chapterId })

  try {
    await prisma.chapter.update({
      where: { id: Number(chapterId) },
      data: { summary: null },
    })

    return NextResponse.json({ message: "Summary deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete summary" }, { status: 500 })
  }
}

