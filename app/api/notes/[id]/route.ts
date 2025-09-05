import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const updateNoteSchema = z.object({
  note: z.string().min(1, "Note content is required"),
  title: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const note = await prisma.bookmark.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
        note: {
          not: null,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        },
        chapter: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error("Error fetching note:", error)
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateNoteSchema.parse(body)

    const existingNote = await prisma.bookmark.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
        note: {
          not: null,
        },
      }
    })

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const note = await prisma.bookmark.update({
      where: { id: parseInt(id) },
      data: validatedData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        },
        chapter: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("Error updating note:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existingNote = await prisma.bookmark.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
        note: {
          not: null,
        },
      }
    })

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await prisma.bookmark.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("Error deleting note:", error)
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}
