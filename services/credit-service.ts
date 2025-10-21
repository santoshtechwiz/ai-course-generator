
import { prisma } from '@/lib/db';

// Credit operation types
export enum CreditOperationType {
  REFUND = 'REFUND',
  QUIZ_CREATION = 'QUIZ_CREATION',
  COURSE_GENERATION = 'COURSE_GENERATION',
  }

// Credit operation result
interface CreditOperationResult {
  success: boolean;
  newBalance: number;
  transactionId?: string;
  error?: string;
}

// Credit validation result
interface CreditValidationResult {
  hasCredits: boolean;
  currentBalance: number;
  requiredCredits: number;
  canProceed: boolean;
  details: {
    userCredits: number;
    subscriptionCredits: number;
    totalCredits: number;
    used: number;
    remaining: number;
  };
}

// Credit audit entry
interface CreditAuditEntry {
  timestamp: Date;
  userId: string;
  operation: CreditOperationType;
  amount: number;
  beforeBalance: number;
  afterBalance: number;
  metadata?: Record<string, any>;
  transactionId: string;
}

class CreditService {
  /**
   * Atomic credit validation with proper isolation
   * Prevents race conditions by checking credits within a transaction
   */
  async validateCredits(
    userId: string, 
    requiredCredits: number
  ): Promise<CreditValidationResult> {
    return await prisma.$transaction(async (tx) => {
      // Get user data to check credits
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          credits: true,
          creditsUsed: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate available credits - in this system, all credits are on user model
      const userCredits = user.credits || 0;
      const usedCredits = user.creditsUsed || 0;
      
      // Available credits = total credits - used credits
      const remainingCredits = Math.max(0, userCredits - usedCredits);
      
      const canProceed = remainingCredits >= requiredCredits;

      return {
        hasCredits: canProceed,
        currentBalance: remainingCredits,
        requiredCredits,
        canProceed,
        details: {
          userCredits,
          subscriptionCredits: 0, // Not used in this system
          totalCredits: userCredits,
          used: usedCredits,
          remaining: remainingCredits
        }
      };
    }, {
      isolationLevel: 'Serializable'
    });
  }

  /**
   * Atomic credit deduction with proper isolation and audit trail
   * Prevents race conditions and ensures data consistency
   */
  async deductCredits(
    userId: string,
    amount: number,
    operation: CreditOperationType,
    metadata?: Record<string, any>
  ): Promise<CreditOperationResult> {
    if (amount <= 0) {
      return { success: false, newBalance: 0, error: 'Invalid credit amount' };
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Step 1: Lock user record and validate credits
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            credits: true,
            creditsUsed: true
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Step 2: Calculate available credits
        const userCredits = user.credits || 0;
        const usedCredits = user.creditsUsed || 0;
        
        const remainingCredits = Math.max(0, userCredits - usedCredits);

        // Step 3: Validate sufficient credits
        if (remainingCredits < amount) {
          return {
            success: false,
            newBalance: remainingCredits,
            error: `Insufficient credits. Required: ${amount}, Available: ${remainingCredits}`
          };
        }

        // Step 4: Update credits used
        const newCreditsUsed = usedCredits + amount;
        const newRemainingCredits = Math.max(0, userCredits - newCreditsUsed);

        await tx.user.update({
          where: { id: userId },
          data: { 
            creditsUsed: newCreditsUsed,
            updatedAt: new Date()
          }
        });

        // Step 5: Create audit trail
        const transaction = await tx.tokenTransaction.create({
          data: {
            userId,
            amount: -amount, // Negative for deduction
            credits: amount,
            type: operation,
            description: metadata?.description || `Credit deduction for ${operation}`,
            createdAt: new Date()
          }
        });

        return {
          success: true,
          newBalance: newRemainingCredits,
          transactionId: transaction.id
        };
      }, {
        isolationLevel: 'Serializable'
      });
    } catch (error) {
      console.error('[CreditService] Credit deduction failed:', error);
      return {
        success: false,
        newBalance: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add credits to user account (for refunds, grants, etc.)
   */
  async addCredits(
    userId: string,
    amount: number,
    operation: CreditOperationType,
    metadata?: Record<string, any>
  ): Promise<CreditOperationResult> {
    if (amount <= 0) {
      return { success: false, newBalance: 0, error: 'Invalid credit amount' };
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // Get current user state
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            credits: true,
            creditsUsed: true
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Add to user's direct credits
        const newUserCredits = (user.credits || 0) + amount;
        
        await tx.user.update({
          where: { id: userId },
          data: { 
            credits: newUserCredits,
            updatedAt: new Date()
          }
        });

        // Create audit trail
        const transaction = await tx.tokenTransaction.create({
          data: {
            userId,
            amount: amount, // Positive for addition
            credits: amount,
            type: operation,
            description: metadata?.description || `Credit addition for ${operation}`,
            createdAt: new Date()
          }
        });

        // Calculate new balance
        const usedCredits = user.creditsUsed || 0;
        const remainingCredits = Math.max(0, newUserCredits - usedCredits);

        return {
          success: true,
          newBalance: remainingCredits,
          transactionId: transaction.id
        };
      }, {
        isolationLevel: 'Serializable'
      });
    } catch (error) {
      console.error('[CreditService] Credit addition failed:', error);
      return {
        success: false,
        newBalance: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get detailed credit information for a user
   */
  async getCreditDetails(userId: string): Promise<CreditValidationResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        creditsUsed: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userCredits = user.credits || 0;
    const usedCredits = user.creditsUsed || 0;
    
    const remainingCredits = Math.max(0, userCredits - usedCredits);

    return {
      hasCredits: remainingCredits > 0,
      currentBalance: remainingCredits,
      requiredCredits: 0,
      canProceed: remainingCredits > 0,
      details: {
        userCredits,
        subscriptionCredits: 0, // Not used in this system
        totalCredits: userCredits,
        used: usedCredits,
        remaining: remainingCredits
      }
    };
  }

  /**
   * Get credit transaction history for audit purposes
   */
  async getCreditHistory(
    userId: string,
    limit: number = 50
  ): Promise<CreditAuditEntry[]> {
    const transactions = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return transactions.map(tx => ({
      timestamp: tx.createdAt,
      userId: tx.userId,
      operation: tx.type as CreditOperationType,
      amount: tx.amount,
      beforeBalance: 0, // Would need to calculate from previous transactions
      afterBalance: 0,  // Would need to calculate from previous transactions
      metadata: undefined,
      transactionId: tx.id
    }));
  }

  /**
   * Validate credit operation before execution
   * Used by API endpoints to check permissions and requirements
   */
  async canPerformOperation(
    userId: string,
    operation: CreditOperationType,
    requiredCredits: number = 1
  ): Promise<{ allowed: boolean; reason?: string; details?: CreditValidationResult }> {
    try {
      const validation = await this.validateCredits(userId, requiredCredits);
      
      if (!validation.canProceed) {
        return {
          allowed: false,
          reason: `Insufficient credits. Required: ${requiredCredits}, Available: ${validation.currentBalance}`,
          details: validation
        };
      }

      return {
        allowed: true,
        details: validation
      };
    } catch (error) {
      return {
        allowed: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Atomic credit check and deduction for quiz/course generation
   * This is the main method that should be used by API endpoints
   */
  async executeCreditsOperation(
    userId: string,
    requiredCredits: number,
    operation: CreditOperationType,
    metadata?: Record<string, any>
  ): Promise<CreditOperationResult> {
    // Ensure user is active before any credit operations (defensive check)
    try {
      // Fetch typed isActive first
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } })
      if (!dbUser) {
        return { success: false, newBalance: 0, error: 'User not found' }
      }
      if (dbUser.isActive === false) {
        return { success: false, newBalance: 0, error: 'Account inactive' }
      }

      // Use typed isActive flag on User model for account/subscription checks
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } })
        if (dbUser && dbUser.isActive === false) {
          return { success: false, newBalance: 0, error: 'Subscription inactive' }
        }
      } catch (e) {
        // If user read fails, continue; higher-level checks will catch missing user
      }
    } catch (err) {
      console.error('[CreditService] Failed to verify user active status', err)
      return { success: false, newBalance: 0, error: 'Failed to verify user status' }
    }

    // First validate credits are available
    const validation = await this.validateCredits(userId, requiredCredits);
    
    if (!validation.canProceed) {
      return {
        success: false,
        newBalance: validation.currentBalance,
        error: `Insufficient credits. Required: ${requiredCredits}, Available: ${validation.currentBalance}`
      };
    }

    // If validation passes, deduct credits atomically
    return await this.deductCredits(userId, requiredCredits, operation, metadata);
  }
}

// Export singleton instance
export const creditService = new CreditService();

// Legacy method for backward compatibility
async function getCreditInfo(userId: string) {
  return creditService.getCreditDetails(userId);
}

// Legacy method for backward compatibility
async function deductCredits(userId: string, amount: number, type: string = 'QUIZ_CREATION') {
  return creditService.deductCredits(userId, amount, type as CreditOperationType);
}