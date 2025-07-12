import { NextResponse } from "next/server"
import { courseService } from "@/app/services/course.service"
import { getAuthSession } from "@/lib/auth"

export async function PUT(request: Request, { params }: { params: { chapterId: string } }) {
  try {
    // Authenticate user
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chapterId } = params
    const { summary } = await request.json()

    // Use service to update chapter summary
    const updatedChapter = await courseService.updateChapterSummary(Number(chapterId), summary)
    return NextResponse.json(updatedChapter)
  } catch (error) {
    console.error("Error updating chapter summary:", error)
    return NextResponse.json({ error: "Failed to update chapter summary" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    // Authenticate user
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chapterId } = await params
    console.log("Received DELETE request:", { chapterId })

    // Use service to delete chapter summary (set to null)
    await courseService.updateChapterSummary(Number(chapterId), null)
    return NextResponse.json({ message: "Summary deleted successfully" })
  } catch (error) {
    console.error("Error deleting summary:", error)
    return NextResponse.json({ error: "Failed to delete summary" }, { status: 500 })
  }
}
