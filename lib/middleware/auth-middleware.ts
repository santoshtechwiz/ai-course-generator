import type { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { formatApiError } from "@/lib/api-utils"

/**
 * Authentication middleware for API routes
 * Provides consistent authentication checks across the application
 */
export async function withAuth(
  handler: (req: NextRequest, session: any) => Promise<NextResponse>,
  options: {
    requireAdmin?: boolean
    requireAuth?: boolean
  } = { requireAuth: true, requireAdmin: false },
): Promise<(req: NextRequest) => Promise<NextResponse>> {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get the authenticated session
      const session = await getAuthSession()

      // Check if authentication is required
      if (options.requireAuth && !session?.user) {
        return formatApiError("Unauthorized", 401)
      }

      // Check if admin access is required
      if (options.requireAdmin && !session?.user?.isAdmin) {
        return formatApiError("Forbidden: Admin access required", 403)
      }

      // Call the handler with the authenticated session
      return handler(req, session)
    } catch (error) {
      console.error("Authentication middleware error:", error)
      return formatApiError("Internal server error", 500)
    }
  }
}

/**
 * Verify resource ownership
 * Ensures that the authenticated user owns the resource they're trying to access
 */
export async function verifyResourceOwnership<T extends { userId: string }>(
  resource: T | null,
  session: any,
  options: {
    allowAdmin?: boolean
  } = { allowAdmin: true },
): Promise<{ isAuthorized: boolean; errorResponse?: NextResponse }> {
  // If resource doesn't exist
  if (!resource) {
    return {
      isAuthorized: false,
      errorResponse: formatApiError("Resource not found", 404),
    }
  }

  // If user is not authenticated
  if (!session?.user) {
    return {
      isAuthorized: false,
      errorResponse: formatApiError("Unauthorized", 401),
    }
  }

  // Check if user is admin and admin access is allowed
  if (options.allowAdmin && session.user.isAdmin) {
    return { isAuthorized: true }
  }

  // Check if user owns the resource
  if (resource.userId !== session.user.id) {
    return {
      isAuthorized: false,
      errorResponse: formatApiError("Forbidden: You don't have access to this resource", 403),
    }
  }

  return { isAuthorized: true }
}

/**
 * Create a standardized error response
 * Ensures consistent error handling across the application
 */
export function createErrorResponse(message: string, status = 400): NextResponse {
  return formatApiError(message, status)
}
