/**
 * AI Context Provider
 *
 * Centralizes context creation and injection at API boundaries.
 * Ensures all AI services receive complete, validated, and secure context.
 */

import { NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { AIRequestContext, ContextValidationResult, SubscriptionTier } from '../types/context'
import { SubscriptionManager } from '../subscription/SubscriptionManager'
import { generateRequestId, extractIPAddress, detectRequestSource } from '../utils/context'
import { SecurityAssessor } from '../security/SecurityAssessor'
import { logger } from '@/lib/logger'

export class AIContextProvider {
  private subscriptionManager: SubscriptionManager
  private securityAssessor: SecurityAssessor

  constructor() {
    this.subscriptionManager = new SubscriptionManager()
    this.securityAssessor = new SecurityAssessor()
  }

  /**
   * Create comprehensive AI request context from session and request
   */
  async createContext(session: Session, request: NextRequest): Promise<AIRequestContext> {
    const requestId = generateRequestId()

    try {
      logger.debug(`[AIContextProvider] Creating context for request ${requestId}`)

      // 1. Validate session and extract user identity
      const userIdentity = await this.validateAndExtractIdentity(session, requestId)

      // 2. Load subscription and credit information
      const subscription = await this.subscriptionManager.getUserSubscription(userIdentity.userId, requestId)

      // 3. Determine permissions and feature access
      const permissions = await this.calculatePermissions(userIdentity, subscription, requestId)

      // 4. Add organizational context if applicable
      const organization = await this.loadOrganizationContext(userIdentity, requestId)

      // 5. Assess security context
      const security = await this.securityAssessor.assessSecurityContext(request, userIdentity, requestId)

      // 6. Create comprehensive context
      const context: AIRequestContext = {
        userId: userIdentity.userId,
        sessionId: session.user?.id || `session_${requestId}`,
        isAuthenticated: true,
        subscription,
        permissions,
        organization,
        request: {
          id: requestId,
          timestamp: new Date(),
          source: detectRequestSource(request),
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: extractIPAddress(request),
          correlationId: request.headers.get('x-correlation-id') || undefined
        },
        security,
        metadata: {
          sessionExpiry: session.expires,
          provider: userIdentity.provider
        }
      }

      // 7. Validate complete context
      const validation = await this.validateContext(context)
      if (!validation.isValid) {
        logger.warn(`[AIContextProvider] Context validation warnings for ${requestId}:`, validation.warnings)
        if (validation.errors.length > 0) {
          throw new Error(`Context validation failed: ${validation.errors.join(', ')}`)
        }
      }

      logger.info(`[AIContextProvider] Context created successfully for user ${userIdentity.userId} (${requestId})`)
      return context

    } catch (error) {
      logger.error(`[AIContextProvider] Failed to create context for ${requestId}:`, error)
      throw new Error(`Context creation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Create anonymous context for public operations
   */
  async createAnonymousContext(request: NextRequest): Promise<AIRequestContext> {
    const requestId = generateRequestId()

    const context: AIRequestContext = {
      userId: `anonymous_${requestId}`,
      sessionId: `session_${requestId}`,
      isAuthenticated: false,
      subscription: {
        plan: 'FREE',
        tier: 'free',
        isActive: true,
        credits: {
          available: 0,
          used: 0,
          limit: 0
        },
        features: []
      },
      permissions: {
        canUseAI: false,
        allowedFeatures: [],
        rateLimits: {
          requestsPerMinute: 10,
          requestsPerHour: 50,
          requestsPerDay: 100,
          burstLimit: 5
        },
        featureFlags: {},
        restrictions: ['anonymous_access']
      },
      request: {
        id: requestId,
        timestamp: new Date(),
        source: detectRequestSource(request),
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: extractIPAddress(request)
      },
      security: {
        riskScore: 50, // Medium risk for anonymous
        requiresApproval: false,
        auditLevel: 'basic',
        encryptionLevel: 'standard',
        complianceRequirements: []
      }
    }

    return context
  }

  /**
   * Update context with new information (e.g., after credit deduction)
   */
  updateContext(context: AIRequestContext, updates: Partial<AIRequestContext>): AIRequestContext {
    return {
      ...context,
      ...updates,
      request: {
        ...context.request,
        timestamp: new Date() // Update timestamp on context changes
      }
    }
  }

  /**
   * Validate session and extract user identity
   */
  private async validateAndExtractIdentity(session: Session, requestId: string) {
    if (!session?.user?.id) {
      throw new Error('Invalid session: missing user ID')
    }

    // Additional session validation could go here
    const userId = session.user.id
    const email = session.user.email
    const provider = this.extractProviderFromSession(session)

    logger.debug(`[AIContextProvider] Extracted identity for ${userId} (${requestId})`)

    return {
      userId,
      email,
      provider
    }
  }

  /**
   * Calculate permissions based on user and subscription
   */
  private async calculatePermissions(userIdentity: any, subscription: any, requestId: string) {
    const basePermissions = await this.subscriptionManager.getPermissionsForSubscription(subscription.plan)

    // Add user-specific permissions if needed
    const userSpecificPermissions = await this.getUserSpecificPermissions(userIdentity.userId)

    return {
      ...basePermissions,
      restrictions: userSpecificPermissions.restrictions || []
    }
  }

  /**
   * Load organizational context if user belongs to an organization
   */
  private async loadOrganizationContext(userIdentity: any, requestId: string) {
    // TODO: Implement organization lookup
    // For now, return undefined for individual users
    return undefined
  }

  private extractProviderFromSession(session: Session): string {
    // Provider information not available in current session structure
    return 'unknown'
  }

  /**
   * Get user-specific permissions (e.g., beta features, restrictions)
   */
  private async getUserSpecificPermissions(userId: string) {
    // TODO: Implement user-specific permission lookup
    return {
      restrictions: []
    }
  }

  /**
   * Validate complete context for consistency and security
   */
  private async validateContext(context: AIRequestContext): Promise<ContextValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic validation
    if (!context.userId) {
      errors.push('Missing userId')
    }

    if (!context.request.id) {
      errors.push('Missing request ID')
    }

    // Subscription validation
    if (context.subscription.credits.available < 0) {
      errors.push('Invalid credit balance')
    }

    // Permission validation
    if (context.permissions.canUseAI && !context.isAuthenticated) {
      errors.push('Anonymous users cannot use AI')
    }

    // Security validation
    if (context.security.riskScore > 100 || context.security.riskScore < 0) {
      errors.push('Invalid risk score')
    }

    // Warnings for potential issues
    if (context.subscription.credits.available === 0 && context.permissions.canUseAI) {
      warnings.push('User has no credits but can use AI')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}