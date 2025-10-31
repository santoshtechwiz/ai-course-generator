/**
 * Centralized AI Configuration
 * 
 * All AI models, limits, and feature configurations for subscription-aware AI services.
 * This is the single source of truth for AI-related settings across all subscription tiers.
 */

import type { SubscriptionPlanType } from '@/types/subscription-plans'
import { getPlanAILimits, getRateLimits as getSubscriptionRateLimits, getModelConfig as getModelConfigFromPlans, AI_MODELS, type PlanAILimits, type RateLimitConfig, type AIModelName, type ModelConfiguration } from '@/types/subscription-plans'

// ============= AI Model Configuration =============

// ============= Subscription-Based Model Selection =============

// ============= Plan-Specific Limits =============

interface PlanLimits extends PlanAILimits {}

const PLAN_LIMITS: Record<SubscriptionPlanType, PlanLimits> = {
  FREE: getPlanAILimits('FREE'),
  BASIC: getPlanAILimits('BASIC'),
  PREMIUM: getPlanAILimits('PREMIUM'),
  ENTERPRISE: getPlanAILimits('ENTERPRISE'),
}

// ============= Error Messages =============

export const AI_ERROR_MESSAGES = {
  // Authentication Errors
  AUTH_REQUIRED: 'You must be logged in to use this feature.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  
  // Subscription Errors
  SUBSCRIPTION_REQUIRED: 'This feature requires an active subscription.',
  UPGRADE_REQUIRED: 'Please upgrade your plan to access this feature.',
  PLAN_LIMIT_REACHED: 'You have reached your plan limit for this feature.',
  
  // Credit Errors
  INSUFFICIENT_CREDITS: 'You do not have enough credits for this action.',
  DAILY_LIMIT_REACHED: 'You have reached your daily limit for this feature.',
  
  // Feature Errors
  FEATURE_DISABLED: 'This feature is currently disabled.',
  FEATURE_NOT_AVAILABLE: 'This feature is not available on your current plan.',
  
  // Input Errors
  INVALID_INPUT: 'Invalid input provided.',
  INPUT_TOO_LONG: 'Input exceeds maximum allowed length.',
  DOCUMENT_TOO_LARGE: 'Document size exceeds maximum allowed size.',
  
  // API Errors
  API_ERROR: 'An error occurred while processing your request.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  MODEL_UNAVAILABLE: 'The selected AI model is currently unavailable.',
  
  // Validation Errors
  INVALID_QUESTION_COUNT: 'Invalid number of questions requested.',
  INVALID_DIFFICULTY: 'Invalid difficulty level specified.',
} as const

// ============= Rate Limiting Configuration =============

interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
}

const RATE_LIMITS: Record<SubscriptionPlanType, RateLimitConfig> = {
  FREE: getSubscriptionRateLimits('FREE'),
  BASIC: getSubscriptionRateLimits('BASIC'),
  PREMIUM: getSubscriptionRateLimits('PREMIUM'),
  ENTERPRISE: getSubscriptionRateLimits('ENTERPRISE'),
}

// ============= Helper Functions =============

/**
 * Get model configuration for a subscription plan
 */
export function getModelConfig(plan: SubscriptionPlanType): ModelConfiguration {
  return getModelConfigFromPlans(plan)
}

/**
 * Get plan limits for a subscription plan
 */
export function getPlanLimits(plan: SubscriptionPlanType): PlanLimits {
  return PLAN_LIMITS[plan]
}

/**
 * Get rate limits for a subscription plan
 */
export function getRateLimits(plan: SubscriptionPlanType): RateLimitConfig {
  return RATE_LIMITS[plan]
}


export { AIModelName }
