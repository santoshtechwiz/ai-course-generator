"use client"

import React from "react"

import { Check, X, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FEATURES, PLAN_FEATURES, FeatureCategory } from "./subscription-plans"
import type { SubscriptionPlanType } from "../../../types/subscription"
import { useMemo } from "react"
import { useAppSelector } from "@/store"
import { selectSubscription } from "@/store/slices/subscription-slice"

/**
 * FeatureCategoryList Component
 *
 * Displays features for a specific plan, organized by category
 */
export function FeatureCategoryList({ planId }: { planId: SubscriptionPlanType }) {
  // Group features by category
  const featuresByCategory = useMemo(() => {
    const planFeatureMatrix = PLAN_FEATURES[planId] || {}

    // Create a map to store features by category
    const categoryMap = new Map<
      FeatureCategory,
      Array<{
        id: string
        name: string
        available: boolean
        description: string
      }>
    >()

    // Initialize categories
    Object.values(FeatureCategory).forEach((category) => {
      categoryMap.set(category, [])
    })

    // Add features to their respective categories
    Object.entries(FEATURES).forEach(([key, feature]) => {
      const availability = planFeatureMatrix[feature.id] || { available: false }
      const category = feature.category

      const featureWithAvailability = {
        id: feature.id,
        name: feature.name,
        available: availability.available,
        description: feature.description,
      }

      const categoryFeatures = categoryMap.get(category) || []
      categoryFeatures.push(featureWithAvailability)
      categoryMap.set(category, categoryFeatures)
    })

    return categoryMap
  }, [planId])

  return (
    <div className="space-y-4">
      {Array.from(featuresByCategory.entries()).map(([category, features]) => {
        // Skip empty categories
        if (features.length === 0) return null

        return (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
            <ul className="space-y-1">
              {features.map((feature) => (
                <li key={feature.id} className="flex items-center gap-2 text-sm">
                  {feature.available ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={!feature.available ? "text-muted-foreground" : ""}>{feature.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

/**
 * FeatureComparison Component
 *
 * Displays a comparison table of features across all subscription plans
 */
export function FeatureComparison() {
  // Get current subscription from Redux
  const subscription = useAppSelector(selectSubscription)

  // Get all unique categories
  const categories = Object.values(FeatureCategory)

  // Get all features grouped by category
  const featuresByCategory = useMemo(() => {
    const categoryMap = new Map<
      FeatureCategory,
      Array<{
        id: string
        name: string
        description: string
        availability: Record<SubscriptionPlanType, boolean>
      }>
    >()

    // Initialize categories
    categories.forEach((category) => {
      categoryMap.set(category, [])
    })

    // Add features to their respective categories
    Object.entries(FEATURES).forEach(([key, feature]) => {
      const category = feature.category

      // Get availability for each plan
      const availability: Record<SubscriptionPlanType, boolean> = {
        FREE: PLAN_FEATURES.FREE[feature.id]?.available || false,
        BASIC: PLAN_FEATURES.BASIC[feature.id]?.available || false,
        PRO: PLAN_FEATURES.PRO[feature.id]?.available || false,
        ULTIMATE: PLAN_FEATURES.ULTIMATE[feature.id]?.available || false,
        PREMIUM: PLAN_FEATURES.PREMIUM?.[feature.id]?.available || false,
        ENTERPRISE: PLAN_FEATURES.ENTERPRISE?.[feature.id]?.available || false,
      }

      const featureWithAvailability = {
        id: feature.id,
        name: feature.name,
        description: feature.description,
        availability,
      }

      const categoryFeatures = categoryMap.get(category) || []
      categoryFeatures.push(featureWithAvailability)
      categoryMap.set(category, categoryFeatures)
    })

    return categoryMap
  }, [])

  return (
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 w-1/3">Feature</th>
            <th className="text-center p-2">Free</th>
            <th className="text-center p-2">Basic</th>
            <th className="text-center p-2">Pro</th>
            <th className="text-center p-2">Ultimate</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const features = featuresByCategory.get(category) || []

            // Skip empty categories
            if (features.length === 0) return null

            return (
              <React.Fragment key={category}>
                <tr className="bg-muted/50">
                  <td colSpan={5} className="p-2 font-medium">
                    {category}
                  </td>
                </tr>
                {features.map((feature) => (
                  <tr key={feature.id} className="border-b border-muted">
                    <td className="p-2 flex items-center gap-2">
                      {feature.name}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{feature.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="text-center p-2">
                      {feature.availability.FREE ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="text-center p-2">
                      {feature.availability.BASIC ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="text-center p-2">
                      {feature.availability.PRO ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="text-center p-2">
                      {feature.availability.ULTIMATE ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default FeatureComparison
