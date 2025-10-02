import { type NextRequest, NextResponse } from "next/server"
import { AuthenticatedApiRoute } from "@/services/base-api-route"
import { z } from "zod"
import { logger } from "@/lib/logger"
// Updated to use the consolidated subscriptions module (server-safe exports)
import { TokenUsageService } from "@/modules/subscriptions"

/**
 * Token Usage API Route
 * Handles retrieving and updating token usage for users
 * 
 * Optimizations:
 * - Uses direct database access for improved performance
 * - Implements proper error handling and validation
 * - Supports various token operations (update, reset, add)
 */
class TokenUsageRoute extends AuthenticatedApiRoute {
  protected schema = z.object({
    tokensUsed: z.number().optional(),
    action: z.enum(['update', 'reset', 'add']).optional()
  }).strict()

  protected async handle(
    req: NextRequest,
    data: { tokensUsed?: number; action?: 'update' | 'reset' | 'add' },
    { session }: { session: import('next-auth').Session }
  ): Promise<NextResponse> {
    try {
      const userId = session.user.id
      
      // Handle GET request - retrieve token usage
      if (req.method === 'GET') {
        const tokenUsage = await TokenUsageService.getTokenUsage(userId)
        return this.success(tokenUsage)
      }
      
      // Handle POST request - update token usage
      if (req.method === 'POST') {
        const { action, tokensUsed = 0 } = data
        
        if (!action) {
          return this.error('Action is required', 400)
        }
        
        let success = false
        
        switch (action) {
          case 'update':
            success = await TokenUsageService.updateTokenUsage(userId, tokensUsed)
            break
            
          case 'reset':
            success = await TokenUsageService.resetTokenUsage(userId)
            break
            
          case 'add':
            success = await TokenUsageService.addTokens(userId, tokensUsed)
            break
            
          default:
            return this.error('Invalid action', 400)
        }
        
        if (!success) {
          return this.error('Failed to update token usage', 500)
        }
        
        // Return updated token usage
        const updatedTokenUsage = await TokenUsageService.getTokenUsage(userId)
        return this.success(updatedTokenUsage)
      }
      
      return this.error('Method not allowed', 405)
    } catch (error) {
      logger.error("Error handling token usage:", error)
      return this.handleError(error)
    }
  }
}

const tokenUsageRoute = new TokenUsageRoute()

export async function GET(req: NextRequest) {
  return tokenUsageRoute.process(req)
}

export async function POST(req: NextRequest) {
  return tokenUsageRoute.process(req)
}
