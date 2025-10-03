import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

/**
 * Debug endpoint to check and manage admin users
 * This should only be used for development/debugging
 */
export async function GET(req: NextRequest) {
  try {
    // Count total users
    const totalUsers = await prisma.user.count()
    
    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        isAdmin: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        userType: true,
        createdAt: true,
      }
    })
    
    // Get recent users (might help identify which user to make admin)
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        userType: true,
        createdAt: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        adminUsers: adminUsers.length
      },
      adminUsers,
      recentUsers,
      instructions: {
        makeUserAdmin: "POST to this endpoint with { email: 'user@example.com' } to make a user admin"
      }
    })
    
  } catch (error) {
    console.error('[AdminDebug] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Make a user admin by email
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }
    
    // Find and update user
    const user = await prisma.user.update({
      where: {
        email: email
      },
      data: {
        isAdmin: true,
        userType: 'PREMIUM' // Also upgrade to premium
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        userType: true,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `User ${email} is now an admin`,
      user
    })
    
  } catch (err) {
    const error: any = err
    console.error('[AdminDebug] Error making user admin:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}