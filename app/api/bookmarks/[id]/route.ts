import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { z } from "zod"

const updateBookmarkSchema = z.object({
  note: z.string().optional(),
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

    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
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

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 })
    }

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error("Error fetching bookmark:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookmark" },
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
    const validatedData = updateBookmarkSchema.parse(body)

    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
      }
    })

    if (!existingBookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 })
    }

    const bookmark = await prisma.bookmark.update({
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

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error("Error updating bookmark:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update bookmark" },
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

    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
      }
    })

    if (!existingBookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 })
    }

    await prisma.bookmark.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: "Bookmark deleted successfully" })
  } catch (error) {
    console.error("Error deleting bookmark:", error)
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    )
  }
}
