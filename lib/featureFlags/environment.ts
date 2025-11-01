/**
 * Environment-Based Feature Flag Management
 * Handles environment overrides and rollout controls
 */

import type { FeatureFlag, FeatureFlagContext, FeatureFlagResult, EnvironmentType } from './types'
import { FEATURE_FLAGS } from './flags'

export class EnvironmentFeatureFlags {
  private static instance: EnvironmentFeatureFlags
  private currentEnv: EnvironmentType
  private envOverrides: Map<string, boolean>
  private rolloutCache: Map<string, boolean>

  constructor() {
    this.currentEnv = (process.env.NODE_ENV as EnvironmentType) || 'development'
    this.envOverrides = new Map()
    this.rolloutCache = new Map()
    this.loadEnvironmentOverrides()
  }

  static getInstance(): EnvironmentFeatureFlags {
    if (!this.instance) {
      this.instance = new EnvironmentFeatureFlags()
    }
    return this.instance
  }

  /**
   * Load environment variable overrides
   */
  private loadEnvironmentOverrides(): void {
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('FEATURE_FLAG_')) {
        const flagName = key.replace('FEATURE_FLAG_', '').toLowerCase().replace(/_/g, '-')
        const value = process.env[key] === 'true'
        this.envOverrides.set(flagName, value)
      }
    })
  }

  /**
   * Check if feature is enabled with full context
   */
  public isEnabled(flagName: string, context?: FeatureFlagContext): FeatureFlagResult {
    const flag = FEATURE_FLAGS[flagName]
    
    if (!flag) {
      return {
        enabled: false,
        reason: 'Feature flag not found',
        metadata: { flagName }
      }
    }

    // Environment override takes precedence
    if (this.envOverrides.has(flagName)) {
      const overrideValue = this.envOverrides.get(flagName)!
      return {
        enabled: overrideValue,
        reason: overrideValue ? 'Environment override enabled' : 'Environment override disabled',
        metadata: { source: 'environment', flagName }
      }
    }

    // Check environment restrictions
    if (flag.environments && !flag.environments.includes(this.currentEnv)) {
      return {
        enabled: false,
        reason: `Not enabled for ${this.currentEnv} environment`,
        metadata: { allowedEnvironments: flag.environments, currentEnv: this.currentEnv }
      }
    }

    // Check deprecation
    if (flag.deprecatedAt) {
      const deprecatedDate = new Date(flag.deprecatedAt)
      if (new Date() > deprecatedDate) {
        console.warn(`Feature flag '${flagName}' is deprecated and will be removed`)
      }
    }

    // Check removal
    if (flag.removedAt) {
      const removedDate = new Date(flag.removedAt)
      if (new Date() > removedDate) {
        return {
          enabled: false,
          reason: 'Feature has been removed',
          metadata: { removedAt: flag.removedAt }
        }
      }
    }

    // Check dependencies
    if (flag.dependencies && context) {
      for (const dependency of flag.dependencies) {
        const depResult = this.isEnabled(dependency, context)
        if (!depResult.enabled) {
          return {
            enabled: false,
            reason: `Dependency '${dependency}' is not enabled`,
            metadata: { dependency, dependencyReason: depResult.reason }
          }
        }
      }
    }

    // Check user context requirements
    if (context) {
      // Auth requirement
      if (flag.requiresAuth && !context.isAuthenticated) {
        return {
          enabled: false,
          reason: 'Authentication required',
          fallbackRoute: '/auth/signin'
        }
      }

      // Subscription requirement
      if (flag.requiresSubscription && !context.hasSubscription) {
        return {
          enabled: false,
          reason: 'Subscription required',
          fallbackRoute: '/dashboard/subscription'
        }
      }

      // Plan requirement
      if (flag.minimumPlan && context.userPlan) {
        // Use centralized plan configuration instead of hardcoded logic
        const { isFeatureEnabledForPlan } = require('./flags')
        if (!isFeatureEnabledForPlan(context.userPlan, flagName)) {
          return {
            enabled: false,
            reason: `${flag.minimumPlan} plan required`,
            fallbackRoute: `/dashboard/subscription?plan=${flag.minimumPlan}`
          }
        }
      }

      // Credits requirement
      if (flag.requiresCredits && !context.hasCredits) {
        return {
          enabled: false,
          reason: 'Credits required',
          fallbackRoute: '/dashboard/subscription'
        }
      }

      // User group requirement
      if (flag.userGroups && context.userGroups) {
        const hasRequiredGroup = flag.userGroups.some((group: string) => 
          context.userGroups!.includes(group)
        )
        if (!hasRequiredGroup) {
          return {
            enabled: false,
            reason: 'Required user group access',
            metadata: { requiredGroups: flag.userGroups, userGroups: context.userGroups }
          }
        }
      }

      // Rollout percentage check
      if (flag.rolloutPercentage && flag.rolloutPercentage < 100 && context.userId) {
        const isInRollout = this.isUserInRollout(context.userId, flagName, flag.rolloutPercentage)
        if (!isInRollout) {
          return {
            enabled: false,
            reason: 'Not in rollout group',
            metadata: { rolloutPercentage: flag.rolloutPercentage }
          }
        }
      }
    }

    return {
      enabled: flag.enabled,
      reason: flag.enabled ? 'Feature enabled' : 'Feature disabled',
      metadata: { source: 'configuration', flagName }
    }
  }

  /**
   * Simple boolean check for feature enabled
   */
  public isFeatureEnabled(flagName: string, context?: FeatureFlagContext): boolean {
    return this.isEnabled(flagName, context).enabled
  }

  /**
   * Check if user is in rollout group using consistent hashing
   */
  private isUserInRollout(userId: string, flagName: string, percentage: number): boolean {
    const cacheKey = `${userId}:${flagName}`
    
    if (this.rolloutCache.has(cacheKey)) {
      return this.rolloutCache.get(cacheKey)!
    }

    // Simple hash function for consistent rollout
    const hash = this.simpleHash(`${userId}:${flagName}`)
    const isInRollout = (hash % 100) < percentage
    
    this.rolloutCache.set(cacheKey, isInRollout)
    return isInRollout
  }

  /**
   * Simple hash function for consistent results
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Get all enabled features for context
   */
  public getEnabledFeatures(context?: FeatureFlagContext): string[] {
    return Object.keys(FEATURE_FLAGS).filter(flagName => 
      this.isFeatureEnabled(flagName, context)
    )
  }

  /**
   * Clear rollout cache (for testing)
   */
  public clearCache(): void {
    this.rolloutCache.clear()
  }

  /**
   * Get current environment
   */
  public getCurrentEnvironment(): EnvironmentType {
    return this.currentEnv
  }
}

// Export singleton instance
export const environmentFeatureFlags = EnvironmentFeatureFlags.getInstance()