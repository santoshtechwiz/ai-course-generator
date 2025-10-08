/**
 * Feature Flags - Centralized Management System
 * Main entry point for all feature flag functionality
 */

// Export types
export type {
  FeatureFlag,
  RouteFeatureConfig,
  FeatureFlagContext,
  FeatureFlagResult,
  FeatureFlagName,
  EnvironmentType
} from './types'

// Export configuration
export {
  FEATURE_FLAGS,
  getRouteFeatures,
  getFeaturesByEnvironment,
  getSubscriptionFeatures,
  type FeatureFlagName as ConfiguredFeatureFlagName
} from './flags'

// Export environment management
export {
  EnvironmentFeatureFlags,
  environmentFeatureFlags
} from './environment'

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

export function getEnabledFeatures(context?: any): string[] {
  return environmentFeatureFlags.getEnabledFeatures(context)
}

// Route-specific feature checking
export function isRouteFeatureEnabled(route: string, context?: any): boolean {
  const routeFeatures = getRouteFeatures()
  const features = routeFeatures[route] || []
  
  // All features for this route must be enabled
  return features.every((feature: string) => isFeatureEnabled(feature, context))
}

// Subscription feature checking
export function hasSubscriptionFeatureAccess(flagName: string, context?: any): boolean {
  const subscriptionFeatures = getSubscriptionFeatures()
  
  if (!subscriptionFeatures.includes(flagName)) {
    return isFeatureEnabled(flagName, context)
  }
  
  // Additional subscription validation
  const result = getFeatureResult(flagName, context)
  return result.enabled
}

// Legacy compatibility (for gradual migration)
export function isEnabled(flagName: string): boolean {
  return isFeatureEnabled(flagName)
}

export function requiresAuth(flagName: string): boolean {
  const flag = FEATURE_FLAGS[flagName]
  return flag?.requiresAuth ?? true
}

export function getFeaturePlan(flagName: string): string | undefined {
  const flag = FEATURE_FLAGS[flagName]
  return flag?.minimumPlan
}

export function getFeatureDescription(flagName: string): string {
  const flag = FEATURE_FLAGS[flagName]
  return flag?.description ?? 'Feature description not available'
}

// Environment utilities
export function getCurrentEnvironment() {
  return environmentFeatureFlags.getCurrentEnvironment()
}

export function clearFeatureFlagCache() {
  environmentFeatureFlags.clearCache()
}