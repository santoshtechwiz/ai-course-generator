/**
 * Token Service
 *
 * This service handles all token-related operations, including
 * token allocation, consumption, and tracking.
 */

import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"

// Cache for token operations to reduce database load
const tokenBalanceCache = new Map<string, { balance: number; timestamp: number }>()
const tokenHistoryCache = new Map<string, { history: any[]; timestamp: number }>()
const CACHE_TTL = 30 * 1000 // 30 seconds

/**
 * Service for managing user tokens
 */
export class TokenService {
  /**
   * Get the current token balance for a user
   *
   * @param userId - The ID of the user
   * @returns The current token balance
   */
  static async getTokenBalance(userId: string): Promise<number> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }      // Check cache first
      const cacheKey = `balance_${userId}`
      const cachedData = tokenBalanceCache.get(cacheKey)

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        logger.debug(`Using cached token balance for user ${userId}`)
        return cachedData.balance
      }

      // Get user's current credits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      if (!user) {
        logger.warn(`User with ID ${userId} not found when getting token balance`)
        return 0
      }

      const balance = user.credits || 0

      // Cache the result
      tokenBalanceCache.set(cacheKey, { balance, timestamp: Date.now() })

      return balance
    } catch (error) {
      logger.error(`Error getting token balance: ${error instanceof Error ? error.message : String(error)}`)
      return 0
    }
  }

  /**
   * Consume tokens for a specific operation
   *
   * @param userId - The ID of the user
   * @param amount - The number of tokens to consume
   * @param operation - The operation being performed
   * @returns Boolean indicating success
   */
  static async consumeTokens(userId: string, amount: number, operation: string): Promise<boolean> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      if (amount <= 0) {
        throw new Error("Token amount must be positive")
      }

      logger.info(`Consuming ${amount} tokens for user ${userId} for operation: ${operation}`)

      // Use a transaction to ensure atomicity
      return await prisma.$transaction(async (tx) => {
        // Get current token balance
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        })

        if (!user) {
          throw new Error(`User with ID ${userId} not found`)
        }

        // Check if user has enough tokens
        if ((user.credits || 0) < amount) {
          logger.warn(`Insufficient tokens for user ${userId}: has ${user.credits}, needs ${amount}`)
          return false
        }

        // Update user credits
        await tx.user.update({
          where: { id: userId },
          data: {
            credits: {
              decrement: amount,
            },
            creditsUsed: {
              increment: amount,
            },
          },
        })

        // Create token transaction record
        await tx.tokenTransaction.create({
          data: {
            userId,
            credits: -amount,
            amount: 0,
            type: "USAGE",
            description: `Used ${amount} tokens for ${operation}`,
          },
        })

        // Clear cache
        this.clearUserCache(userId)

        logger.info(`Successfully consumed ${amount} tokens for user ${userId}`)
        return true
      })
    } catch (error) {
      logger.error(`Error consuming tokens: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }

  /**
   * Add tokens to a user's account
   *
   * @param userId - The ID of the user
   * @param amount - The number of tokens to add
   * @param source - The source of the tokens
   * @param description - Description of the transaction
   * @returns Boolean indicating success
   */
  static async addTokens(userId: string, amount: number, source: string, description: string): Promise<boolean> {
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }

      if (amount <= 0) {
        throw new Error("Token amount must be positive")
      }

      logger.info(`Adding ${amount} tokens to user ${userId} from ${source}`)

      // Use a transaction to ensure atomicity
      return await prisma.$transaction(async (tx) => {
        // Update user credits
        await tx.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: amount,
            },
          },
        })

        // Create token transaction record
        await tx.tokenTransaction.create({
          data: {
            userId,
            credits: amount,
            amount: 0,
            type: source,
            description,
          },
        })

        // Clear cache
        this.clearUserCache(userId)

        logger.info(`Successfully added ${amount} tokens to user ${userId}`)
        return true
      })
    } catch (error) {
      logger.error(`Error adding tokens: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }

  /**
   * Get token usage history for a user
   *
   * @param userId - The ID of the user
   * @param limit - Maximum number of records to return
   * @returns Array of token transactions
   */
  static async getTokenHistory(userId: string, limit = 50): Promise<any[]> {
    try {
      if (!userId) {
        logger.warn("No user ID provided for token history")
        return []
      }      // Check cache first
      const cacheKey = `history_${userId}_${limit}`
      const cachedData = tokenHistoryCache.get(cacheKey)

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        logger.debug(`Using cached token history for user ${userId}`)
        return cachedData.history
      }

      // Get token transactions from database
      const transactions = await prisma.tokenTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      })

      // Format transactions
      const result = transactions.map((tx) => ({
        id: tx.id,
        amount: tx.credits,
        type: tx.type,
        description: tx.description,
        date: tx.createdAt.toISOString(),
      }))      // Cache the result
      tokenHistoryCache.set(cacheKey, { history: result, timestamp: Date.now() })

      return result
    } catch (error) {
      logger.error(`Error fetching token history: ${error instanceof Error ? error.message : String(error)}`)
      return []
    }
  }

  /**
   * Check if a user has enough tokens for an operation
   *
   * @param userId - The ID of the user
   * @param amount - The number of tokens required
   * @returns Boolean indicating if user has enough tokens
   */
  static async hasEnoughTokens(userId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getTokenBalance(userId)
      return balance >= amount
    } catch (error) {
      logger.error(`Error checking token balance: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }
  /**
   * Clear cache for a specific user
   * @private
   */  private static clearUserCache(userId: string): void {
    const balanceKeysToDelete = Array.from(tokenBalanceCache.keys()).filter((key: string) => key.includes(userId))
    const historyKeysToDelete = Array.from(tokenHistoryCache.keys()).filter((key: string) => key.includes(userId))

    balanceKeysToDelete.forEach((key: string) => {
      tokenBalanceCache.delete(key)
    })

    historyKeysToDelete.forEach((key: string) => {
      tokenHistoryCache.delete(key)
    })
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    tokenBalanceCache.clear()
    tokenHistoryCache.clear()
    logger.info("Cleared all token cache")
  }
}
