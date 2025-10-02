import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { SecurityService } from '@/services/security-service'

export class TokenUsageService {
  /**
   * Get token usage for a user
   */
  static async getTokenUsage(userId: string): Promise<{ used: number; total: number }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          credits: true,
          creditsUsed: true
        }
      })

      if (!user) {
        return { used: 0, total: 0 }
      }

      return {
        used: user.creditsUsed || 0,
        total: user.credits || 0
      }
    } catch (error: any) {
      logger.error(
        `Error fetching token usage for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return { used: 0, total: 0 }
    }
  }

  /**
   * Update token usage for a user
   */
  static async updateTokenUsage(userId: string, tokensUsed: number): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditsUsed: {
            increment: tokensUsed
          }
        }
      })
      return true
    } catch (error: any) {
      logger.error(
        `Error updating token usage for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }

  /**
   * Add tokens to a user's balance
   */
  static async addTokens(userId: string, tokens: number): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: tokens
          }
        }
      })
      return true
    } catch (error: any) {
      logger.error(
        `Error adding tokens for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }

  /**
   * Reset token usage for a user
   */
  static async resetTokenUsage(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditsUsed: 0
        }
      })
      return true
    } catch (error: any) {
      logger.error(
        `Error resetting token usage for user ${SecurityService.maskSensitiveString(userId)}:`,
        SecurityService.sanitizeError(error)
      )
      return false
    }
  }
}