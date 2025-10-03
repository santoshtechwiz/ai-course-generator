import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/middlewares/auth-middleware"
import prisma from "@/lib/db"

/**
 * Debug endpoint to test admin user fetching
 * This will help identify any issues with the admin user API
 */
export const GET = withAdminAuth(async (req: NextRequest, session) => {
  try {
    console.log(`[AdminDebug] Admin user ${session.user?.email} requesting user debug data`)
    
    // Test database connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`
    console.log(`[AdminDebug] Database connection test:`, dbTest)
    
    // Count total users
    const totalUsers = await prisma.user.count()
    console.log(`[AdminDebug] Total users in database: ${totalUsers}`)
    
    // Fetch first 10 users with basic info
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        credits: true,
        isAdmin: true,
        createdAt: true,
        lastActiveAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`[AdminDebug] Fetched ${users.length} users successfully`)
    
    // Check if admin user exists
    const adminUsers = await prisma.user.findMany({
      where: {
        isAdmin: true
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    })
    
    console.log(`[AdminDebug] Found ${adminUsers.length} admin users`)
    
    return NextResponse.json({
      success: true,
      debug: {
        sessionUser: {
          id: session.user?.id,
          email: session.user?.email,
          isAdmin: session.user?.isAdmin
        },
        database: {
          connectionTest: dbTest,
          totalUsers,
          adminUsers: adminUsers.length,
          sampleUsers: users.length
        },
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          credits: user.credits,
          isAdmin: user.isAdmin,
          lastActive: user.lastActiveAt,
        }))
      }
    })
    
  } catch (error) {
    console.error('[AdminDebug] Error in debug endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
})