/**
 * Subscription Module Types
 *
 * This file contains all the type definitions for the subscription module.
 * It serves as a central place for all interfaces and types used across
 * the subscription system.
 */

import type { LucideIcon } from "lucide-react"
// Import shared types from types/shared-types instead of local declarations
import type {
  SubscriptionPlanType,
 
} from '../../../../types/shared-types'

// Subscription status response
export interface SubscriptionStatusResponse {
  credits: number
  tokensUsed: number
  isSubscribed: boolean
  subscriptionPlan: SubscriptionPlanType
  expirationDate?: string
  cancelAtPeriodEnd?: boolean
  status?: string
  isActive?: boolean
  active?: boolean
  plan?: string
  expiresAt?: string
  features?: string[]
}
