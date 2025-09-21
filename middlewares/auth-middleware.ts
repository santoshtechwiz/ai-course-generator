import { NextRequest, NextResponse } from "next/server"
import { AuthService, UnauthorizedError } from "@/services/auth-service"
import { logger } from "@/lib/logger"
import { Session } from "next-auth"

type AuthenticatedHandler = (req: NextRequest, session: Session) => Promise<NextResponse>

/**
 * Higher-order function that wraps API route handlers requiring authentication
 * Provides consistent error handling and session verification
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const session = await AuthService.verifySession()
      
      // Cache the session for subsequent requests
      if (session.user?.id) {
        AuthService.cacheSession(session.user.id, session)
      }
      
      return handler(req, session)
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return AuthService.createUnauthorizedResponse(error.message)
      }
      
      logger.error("Authentication error:", error)
      return NextResponse.json(
        { 
          error: "Internal server error",
          message: "An unexpected error occurred",
          code: "INTERNAL_SERVER_ERROR"
        }, 
        { status: 500 }
      )
    }
  }
}

/**
 * Higher-order function that wraps API route handlers requiring admin privileges
 */
export function withAdminAuth(handler: AuthenticatedHandler) {
  return withAuth(async (req: NextRequest, session: Session) => {
    if (!AuthService.isAdmin(session)) {
      return AuthService.createUnauthorizedResponse("Admin privileges required")
    }
    
    return handler(req, session)
  })
}