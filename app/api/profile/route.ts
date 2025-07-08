import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { userService } from "@/app/services/user.service"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await userService.getUserProfile(session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Profile API error:", error)
    
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    const updatedUser = await userService.updateUserProfile(session.user.id, data)
    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Profile update API error:", error)
    
    if (error instanceof Error && error.message === "No valid fields to update") {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
