"use client"

import React from "react"
import { useMemo } from "react"

import { Check, X } from "lucide-react"
import { getPlanConfig, SUBSCRIPTION_PLANS } from "@/types/subscription-plans"
import type { SubscriptionPlanType } from "@/types/subscription"
import { useAuth } from "@/modules/auth"

/**
 * FeatureCategoryList Component
 *
 * Displays features for a specific plan, organized by category
 */
export function FeatureCategoryList({ planId }: { planId: SubscriptionPlanType }) {
  // Get plan configuration
  const plan = getPlanConfig(planId)
  
  // Build features list from plan config
  const features = useMemo(() => {
    const featureList: Array<{ name: string; available: boolean; category: string }> = [
      // Core Features
      { name: 'Course Creation', available: plan.courseCreation, category: 'Core Features' },
      { name: 'Content Creation', available: plan.contentCreation, category: 'Core Features' },
      { name: 'PDF Downloads', available: plan.pdfDownloads, category: 'Core Features' },
      { name: 'Video Transcripts', available: plan.videoTranscripts, category: 'Core Features' },
      
      // Quiz Types
      { name: 'MCQ Generator', available: plan.mcqGenerator, category: 'Quiz Types' },
      { name: 'Fill in the Blanks', available: plan.fillInBlanks, category: 'Quiz Types' },
      { name: 'Open-ended Questions', available: plan.openEndedQuestions, category: 'Quiz Types' },
      { name: 'Code Quiz', available: plan.codeQuiz, category: 'Quiz Types' },
      { name: 'Video Quiz', available: plan.videoQuiz, category: 'Quiz Types' },
      
      // Limits & Credits
      { 
        name: `Up to ${plan.maxQuestionsPerQuiz === 'unlimited' ? '∞' : plan.maxQuestionsPerQuiz} questions per quiz`, 
        available: true,
        category: 'Limits & Credits'
      },
      { name: `${plan.monthlyCredits} AI credits per month`, available: true, category: 'Limits & Credits' },
      
      // Support & Advanced
      { name: 'Priority Support', available: plan.prioritySupport, category: 'Support & Services' },
      { name: `AI Accuracy: ${plan.aiAccuracy}`, available: true, category: 'Advanced Features' },
    ]
    
    return featureList
  }, [plan])
  
  // Group features by category
  const featuresByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ name: string; available: boolean }>> = {}
    
    features.forEach(feature => {
      if (!grouped[feature.category]) {
        grouped[feature.category] = []
      }
      grouped[feature.category].push({
        name: feature.name,
        available: feature.available
      })
    })
    
    return grouped
  }, [features])

  return (
    <div className="space-y-4">
      {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => {
        // Skip empty categories
        if (categoryFeatures.length === 0) return null

        return (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
            <ul className="space-y-1">
              {categoryFeatures.map((feature, idx) => (
                <li key={`${category}-${idx}`} className="flex items-center gap-2 text-sm">
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
  // Get all plans
  const plans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
  
  // Build feature comparison data
  const featuresByCategory = useMemo(() => {
    const categories = ['Core Features', 'Quiz Types', 'Limits & Credits', 'Support & Services', 'Advanced Features']
    
    const categoryMap: Record<string, Array<{
      name: string
      availability: Record<SubscriptionPlanType, boolean | string>
    }>> = {}
    
    categories.forEach(cat => {
      categoryMap[cat] = []
    })
    
    // Core Features
    categoryMap['Core Features'].push(
      { name: 'Course Creation', availability: { FREE: true, BASIC: true, PREMIUM: true, ENTERPRISE: true } },
      { name: 'Content Creation', availability: { FREE: true, BASIC: true, PREMIUM: true, ENTERPRISE: true } },
      { name: 'PDF Downloads', availability: { FREE: false, BASIC: true, PREMIUM: true, ENTERPRISE: true } },
      { name: 'Video Transcripts', availability: { FREE: false, BASIC: true, PREMIUM: true, ENTERPRISE: true } }
    )
    
    // Quiz Types
    plans.forEach(planId => {
      const plan = SUBSCRIPTION_PLANS[planId]
      if (!categoryMap['Quiz Types'].find(f => f.name === 'MCQ Generator')) {
        categoryMap['Quiz Types'].push(
          { name: 'MCQ Generator', availability: {} as any },
          { name: 'Fill in the Blanks', availability: {} as any },
          { name: 'Open-ended Questions', availability: {} as any },
          { name: 'Code Quiz', availability: {} as any },
          { name: 'Video Quiz', availability: {} as any }
        )
      }
      
      categoryMap['Quiz Types'][0].availability[planId] = plan.mcqGenerator
      categoryMap['Quiz Types'][1].availability[planId] = plan.fillInBlanks
      categoryMap['Quiz Types'][2].availability[planId] = plan.openEndedQuestions
      categoryMap['Quiz Types'][3].availability[planId] = plan.codeQuiz
      categoryMap['Quiz Types'][4].availability[planId] = plan.videoQuiz
    })
    
    // Limits & Credits
    plans.forEach(planId => {
      const plan = SUBSCRIPTION_PLANS[planId]
      if (!categoryMap['Limits & Credits'].find(f => f.name === 'Max Questions Per Quiz')) {
        categoryMap['Limits & Credits'].push(
          { name: 'Max Questions Per Quiz', availability: {} as any },
          { name: 'AI Credits Per Month', availability: {} as any }
        )
      }
      
      categoryMap['Limits & Credits'][0].availability[planId] = plan.maxQuestionsPerQuiz === 'unlimited' ? '∞' : plan.maxQuestionsPerQuiz.toString()
      categoryMap['Limits & Credits'][1].availability[planId] = plan.monthlyCredits.toString()
    })
    
    // Support & Advanced
    categoryMap['Support & Services'].push(
      { name: 'Priority Support', availability: { FREE: false, BASIC: false, PREMIUM: true, ENTERPRISE: true } }
    )
    
    plans.forEach(planId => {
      const plan = SUBSCRIPTION_PLANS[planId]
      if (!categoryMap['Advanced Features'].find(f => f.name === 'AI Accuracy')) {
        categoryMap['Advanced Features'].push(
          { name: 'AI Accuracy', availability: {} as any }
        )
      }
      
      categoryMap['Advanced Features'][0].availability[planId] = plan.aiAccuracy
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
            <th className="text-center p-2">Premium</th>
            <th className="text-center p-2">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(featuresByCategory).map(([category, features]) => {
            // Skip empty categories
            if (features.length === 0) return null

            return (
              <React.Fragment key={category}>
                <tr className="bg-muted/50">
                  <td colSpan={5} className="p-2 font-medium">
                    {category}
                  </td>
                </tr>
                {features.map((feature, idx) => (
                  <tr key={`${category}-${idx}`} className="border-b border-muted">
                    <td className="p-2">
                      {feature.name}
                    </td>
                    <td className="text-center p-2">
                      {typeof feature.availability.FREE === 'boolean' ? (
                        feature.availability.FREE ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{feature.availability.FREE}</span>
                      )}
                    </td>
                    <td className="text-center p-2">
                      {typeof feature.availability.BASIC === 'boolean' ? (
                        feature.availability.BASIC ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{feature.availability.BASIC}</span>
                      )}
                    </td>
                    <td className="text-center p-2">
                      {typeof feature.availability.PREMIUM === 'boolean' ? (
                        feature.availability.PREMIUM ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{feature.availability.PREMIUM}</span>
                      )}
                    </td>
                    <td className="text-center p-2">
                      {typeof feature.availability.ENTERPRISE === 'boolean' ? (
                        feature.availability.ENTERPRISE ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-sm">{feature.availability.ENTERPRISE}</span>
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
