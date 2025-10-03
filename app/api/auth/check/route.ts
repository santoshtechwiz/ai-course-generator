import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

/**
 * Simple auth check endpoint to debug authentication issues
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[AuthCheck] Checking authentication...')
    console.log('[AuthCheck] Headers:', Object.fromEntries(req.headers.entries()))
    console.log('[AuthCheck] Cookies:', req.cookies.getAll())
    
    const session = await getServerSession(authOptions)
    console.log('[AuthCheck] Session:', session ? 'exists' : 'null')
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: "No session found",
        user: null,
        cookies: req.cookies.getAll(),
        debug: {
          hasNextAuthToken: req.cookies.has('next-auth.session-token') || req.cookies.has('__Secure-next-auth.session-token'),
          allCookies: req.cookies.getAll().map(c => c.name)
        }
      }, { status: 401 })
    }
    
    console.log('[AuthCheck] User:', {
      id: session.user?.id,
      email: session.user?.email,
      isAdmin: session.user?.isAdmin
    })
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
        isAdmin: session.user?.isAdmin,
        userType: session.user?.userType,
      },
      session: {
        expires: session.expires
      },
      debug: {
        hasNextAuthToken: req.cookies.has('next-auth.session-token') || req.cookies.has('__Secure-next-auth.session-token'),
        cookieCount: req.cookies.getAll().length
      }
    })
    
  } catch (error) {
    console.error('[AuthCheck] Error:', error)
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Authentication check failed",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}