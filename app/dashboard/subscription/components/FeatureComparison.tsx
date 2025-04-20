"use client"

/**
 * Feature Comparison Component
 *
 * This component displays a comparison of features across different subscription plans.
 */

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { SUBSCRIPTION_PLANS, FEATURES, FeatureCategory } from "./subscription-plans"

import type { SubscriptionPlanType } from "../types/subscription"
import { getPlanFeaturesByCategory } from "../utils/feature-utils"

export function FeatureComparison() {
  const [activeCategory, setActiveCategory] = useState<string>(FeatureCategory.CORE)

  // Get all unique categories from features
  const categories = Object.values(FeatureCategory)

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Compare Plan Features</h2>

      <Tabs defaultValue={FeatureCategory.CORE} onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs md:text-sm">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <div className="overflow-x-auto rounded-xl border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-48 font-semibold">Feature</TableHead>
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <TableHead key={plan.id} className="text-center font-semibold">
                        {plan.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(FEATURES)
                    .filter((feature) => feature.category === category)
                    .map((feature, index) => (
                      <TableRow key={feature.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                        <TableCell className="font-medium">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                {feature.name}
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{feature.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        {SUBSCRIPTION_PLANS.map((plan) => {
                          const isAvailable = plan.features.find((f) => f.id === feature.id)?.available || false
                          return (
                            <TableCell key={plan.id} className="text-center">
                              {isAvailable ? (
                                <div className="flex justify-center">
                                  <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                                    <X className="h-4 w-4 text-slate-400" />
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export function FeatureCategoryList({ planId }: { planId: SubscriptionPlanType }) {
  const categorizedFeatures = getPlanFeaturesByCategory(planId)

  return (
    <div className="space-y-6">
      {Object.entries(categorizedFeatures).map(([category, features]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{category}</h3>
          <ul className="space-y-2">
            {(features as { id: string; name: string; available: boolean }[])
              .filter((feature) => feature.available)
              .map((feature) => (
                <li key={feature.id} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature.name}</span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
