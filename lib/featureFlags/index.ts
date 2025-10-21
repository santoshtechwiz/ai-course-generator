/**
 * Feature Flags - Centralized Management System
 * Main entry point for all feature flag functionality
 */

// Export types
export type {
  
  
  FeatureFlagContext,
  
  
  
} from './types'

// Export configuration


// Export environment management


// Import for internal use
import { environmentFeatureFlags } from './environment'
import { FEATURE_FLAGS, getRouteFeatures, getSubscriptionFeatures } from './flags'

// Main feature flag functions (convenience exports)
export function isFeatureEnabled(flagName: string, context?: any): boolean {
  return environmentFeatureFlags.isFeatureEnabled(flagName, context)
}

export function getFeatureResult(flagName: string, context?: any) {
  return environmentFeatureFlags.isEnabled(flagName, context)
}

function getEnabledFeatures(context?: any): string[] {
  return environmentFeatureFlags.getEnabledFeatures(context)
}

// Route-specific feature checking
function isRouteFeatureEnabled(route: string, context?: any): boolean {
  const routeFeatures = getRouteFeatures()
  const features = routeFeatures[route] || []
  
  // All features for this route must be enabled
  return features.every((feature: string) => isFeatureEnabled(feature, context))
}

// Subscription feature checking
function hasSubscriptionFeatureAccess(flagName: string, context?: any): boolean {
  const subscriptionFeatures = getSubscriptionFeatures()
  
  if (!subscriptionFeatures.includes(flagName)) {
    return isFeatureEnabled(flagName, context)
  }
  
  // Additional subscription validation
  const result = getFeatureResult(flagName, context)
  return result.enabled
}

// Legacy compatibility (for gradual migration)
function isEnabled(flagName: string): boolean {
  return isFeatureEnabled(flagName)
}

function requiresAuth(flagName: string): boolean {
  const flag = FEATURE_FLAGS[flagName]
  return flag?.requiresAuth ?? true
}

function getFeaturePlan(flagName: string): string | undefined {
  const flag = FEATURE_FLAGS[flagName]
  return flag?.minimumPlan
}

function getFeatureDescription(flagName: string): string {
  const flag = FEATURE_FLAGS[flagName]
  return flag?.description ?? 'Feature description not available'
}

// Environment utilities
function getCurrentEnvironment() {
  return environmentFeatureFlags.getCurrentEnvironment()
}

function clearFeatureFlagCache() {
  environmentFeatureFlags.clearCache()
}