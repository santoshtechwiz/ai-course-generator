/**
 * Feature Utilities
 *
 * This file provides utility functions for working with subscription features.
 */

import { PLAN_FEATURES, FEATURES, FeatureCategory } from "../components/subscription-plans"
import type { SubscriptionPlanType } from "../../../types/subscription"

/**
 * Get all features for a specific plan
 */
export function getPlanFeatures(planId: SubscriptionPlanType) {
  const planFeatureMatrix = PLAN_FEATURES[planId] || {}

  return Object.entries(FEATURES).map(([key, feature]) => {
    const availability = planFeatureMatrix[feature.id] || { available: false }
    return {
      ...feature,
      ...availability,
    }
  })
}

/**
 * Get features by category for a specific plan
 */
export function getPlanFeaturesByCategory(planId: SubscriptionPlanType) {
  const features = getPlanFeatures(planId)

  // Group features by category
  const categorizedFeatures = features.reduce(
    (acc, feature) => {
      const category = feature.category || FeatureCategory.CORE
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(feature)
      return acc
    },
    {} as Record<string, typeof features>,
  )

  return categorizedFeatures
}

/**
 * Compare features between two plans
 */
export function compareFeatures(planA: SubscriptionPlanType, planB: SubscriptionPlanType) {
  const featuresA = getPlanFeatures(planA)
  const featuresB = getPlanFeatures(planB)

  const differences = featuresA.map((featureA) => {
    const featureB = featuresB.find((f) => f.id === featureA.id)
    return {
      ...featureA,
      availableInA: featureA.available,
      availableInB: featureB?.available || false,
      difference: featureA.available !== (featureB?.available || false),
    }
  })

  return differences.filter((d) => d.difference)
}

/**
 * Check if a specific feature is available in a plan
 */
export function isFeatureAvailable(planId: SubscriptionPlanType, featureId: string) {
  const planFeatureMatrix = PLAN_FEATURES[planId] || {}
  return planFeatureMatrix[featureId]?.available || false
}

/**
 * Get all plans that have a specific feature
 */
export function getPlansWithFeature(featureId: string): SubscriptionPlanType[] {
  return Object.entries(PLAN_FEATURES)
    .filter(([planId, features]) => features[featureId]?.available)
    .map(([planId]) => planId as SubscriptionPlanType)
}
