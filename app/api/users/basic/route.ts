import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/middlewares/auth-middleware"
import prisma from "@/lib/db"

/**
 * Basic users endpoint that requires authentication but not admin privileges
 */
export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    console.log(`[BasicUsers] User ${session.user?.email} requesting basic user data`)
    
    // Just get basic info about the current user
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        credits: true,
        isAdmin: true,
      }
    })
    
    if (!user) {
      return NextResponse.json({
        error: "User not found"
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      user: user,
      session: {
        user: session.user
      }
    })
    
  } catch (error) {
    console.error('[BasicUsers] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})