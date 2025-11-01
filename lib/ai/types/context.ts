/**
 * AI Request Context Types
 *
 * Defines the comprehensive context structure passed to all AI services,
 * ensuring consistent identity, subscription, and security information.
 */

import type { SubscriptionPlanType } from '@/types/subscription-plans'

// ============= SUBSCRIPTION & BILLING TYPES =============

export interface SubscriptionContext {
  plan: SubscriptionPlanType
  tier: SubscriptionTier
  isActive: boolean
  expiresAt?: Date
  credits: {
    available: number
    used: number
    limit: number
  }
  features: string[] // Available features for this subscription
}

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise'

// ============= PERMISSIONS & ACCESS TYPES =============

export interface PermissionContext {
  canUseAI: boolean
  allowedFeatures: string[]
  rateLimits: RateLimitConfig
  featureFlags: Record<string, boolean>
  restrictions: string[] // Any active restrictions
}

export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstLimit: number
}

// ============= ORGANIZATIONAL CONTEXT TYPES =============

export interface OrganizationContext {
  id: string
  name: string
  billingAccount: string
  policies: OrganizationPolicy[]
  settings: OrganizationSettings
}

export interface OrganizationPolicy {
  type: 'security' | 'usage' | 'billing' | 'compliance'
  name: string
  value: any
  enforced: boolean
}

export interface OrganizationSettings {
  allowPersonalAI: boolean
  maxUsers: number
  customRateLimits?: Partial<RateLimitConfig>
  auditLevel: 'basic' | 'detailed' | 'comprehensive'
}

// ============= REQUEST METADATA TYPES =============

export interface RequestContext {
  id: string
  timestamp: Date
  source: RequestSource
  userAgent?: string
  ipAddress?: string
  sessionId?: string
  correlationId?: string
}

export type RequestSource = 'api' | 'web' | 'mobile' | 'internal'

// ============= SECURITY CONTEXT TYPES =============

export interface SecurityContext {
  riskScore: number // 0-100, higher = more risky
  requiresApproval: boolean
  auditLevel: AuditLevel
  encryptionLevel: 'standard' | 'enhanced'
  complianceRequirements: string[]
}

export type AuditLevel = 'basic' | 'detailed' | 'comprehensive'

// ============= MAIN AI REQUEST CONTEXT =============

export interface AIRequestContext {
  // Identity & Authentication
  userId: string
  sessionId: string
  isAuthenticated: boolean

  // Subscription & Billing
  subscription: SubscriptionContext

  // Permissions & Access
  permissions: PermissionContext

  // Organizational Context (optional for individual users)
  organization?: OrganizationContext

  // Request Metadata
  request: RequestContext

  // Security Context
  security: SecurityContext

  // Additional Metadata
  metadata?: Record<string, any>
}

// ============= UTILITY TYPES =============

export interface ContextValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedContext?: Partial<AIRequestContext>
}

export interface ContextUpdate {
  field: keyof AIRequestContext
  value: any
  reason: string
  timestamp: Date
}

// ============= LEGACY COMPATIBILITY TYPES =============

/**
 * @deprecated Use AIRequestContext instead
 * Kept for backward compatibility during migration
 */
export interface SimpleAIContext {
  userId?: string
  subscriptionPlan: SubscriptionPlanType
  isAuthenticated: boolean
  credits?: number
}