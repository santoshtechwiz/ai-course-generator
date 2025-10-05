/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { 
  buildFeatureList,
  formatCredits,
  getPlanBadgeColor,
  getPlanGradient 
} from '@/utils/subscription-ui-helpers'
import SUBSCRIPTION_PLANS from '@/types/subscription-plans'

describe('buildFeatureList', () => {
  it('should build feature list for FREE plan', () => {
    const features = buildFeatureList(SUBSCRIPTION_PLANS.FREE)
    
    expect(Array.isArray(features)).toBe(true)
    expect(features.length).toBeGreaterThan(0)
    expect(features.some(f => typeof f === 'string' && f.includes('question'))).toBe(true)
  })

  it('should build feature list for BASIC plan', () => {
    const features = buildFeatureList(SUBSCRIPTION_PLANS.BASIC)
    
    expect(features.length).toBeGreaterThan(0)
    expect(features.some(f => typeof f === 'string' && f.includes('quiz'))).toBe(true)
  })

  it('should build feature list for PREMIUM plan', () => {
    const features = buildFeatureList(SUBSCRIPTION_PLANS.PREMIUM)
    
    expect(features.length).toBeGreaterThan(0)
    // Premium should have more features than basic
    const basicFeatures = buildFeatureList(SUBSCRIPTION_PLANS.BASIC)
    expect(features.length).toBeGreaterThanOrEqual(basicFeatures.length)
  })

  it('should build feature list for ENTERPRISE plan', () => {
    const features = buildFeatureList(SUBSCRIPTION_PLANS.ENTERPRISE)
    
    expect(features.length).toBeGreaterThan(0)
    expect(features.some(f => typeof f === 'string' && f.includes('Unlimited'))).toBe(true)
  })

  it('should include maxQuestionsPerQuiz in features', () => {
    const features = buildFeatureList(SUBSCRIPTION_PLANS.BASIC)
    const maxQuestions = SUBSCRIPTION_PLANS.BASIC.maxQuestionsPerQuiz
    
    const hasQuestionFeature = features.some(f => 
      typeof f === 'string' && f.includes(maxQuestions.toString())
    )
    expect(hasQuestionFeature).toBe(true)
  })

  it('should include monthlyCredits in features', () => {
    const features = buildFeatureList(SUBSCRIPTION_PLANS.PREMIUM)
    const credits = SUBSCRIPTION_PLANS.PREMIUM.monthlyCredits
    
    const hasCreditsFeature = features.some(f => 
      typeof f === 'string' && (
        f.includes(credits.toString()) || 
        f.toLowerCase().includes('credit')
      )
    )
    expect(hasCreditsFeature).toBe(true)
  })

  it('should include conditional features based on flags', () => {
    const enterpriseFeatures = buildFeatureList(SUBSCRIPTION_PLANS.ENTERPRISE)
    
    if (SUBSCRIPTION_PLANS.ENTERPRISE.canGenerateCourse) {
      expect(enterpriseFeatures.some(f => 
        typeof f === 'string' && f.toLowerCase().includes('course')
      )).toBe(true)
    }

    if (SUBSCRIPTION_PLANS.ENTERPRISE.canAccessPDF) {
      expect(enterpriseFeatures.some(f => 
        typeof f === 'string' && f.toLowerCase().includes('pdf')
      )).toBe(true)
    }
  })
})

describe('formatCredits', () => {
  it('should format numeric credits correctly', () => {
    expect(formatCredits(100)).toBe('100')
    expect(formatCredits(1000)).toBe('1,000')
    expect(formatCredits(1000000)).toBe('1,000,000')
  })

  it('should handle "unlimited" string', () => {
    expect(formatCredits('unlimited')).toBe('Unlimited')
  })

  it('should handle zero credits', () => {
    expect(formatCredits(0)).toBe('0')
  })

  it('should handle negative credits (edge case)', () => {
    expect(formatCredits(-10)).toBe('-10')
  })

  it('should format all plan monthly credits', () => {
    Object.values(SUBSCRIPTION_PLANS).forEach(plan => {
      const formatted = formatCredits(plan.monthlyCredits)
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })
})

describe('getPlanBadgeColor', () => {
  it('should return correct color for FREE plan', () => {
    const color = getPlanBadgeColor('FREE')
    expect(color).toBe('bg-gray-500')
  })

  it('should return correct color for BASIC plan', () => {
    const color = getPlanBadgeColor('BASIC')
    expect(color).toBe('bg-blue-500')
  })

  it('should return correct color for PREMIUM plan', () => {
    const color = getPlanBadgeColor('PREMIUM')
    expect(color).toBe('bg-purple-500')
  })

  it('should return correct color for ENTERPRISE plan', () => {
    const color = getPlanBadgeColor('ENTERPRISE')
    expect(color).toBe('bg-amber-500')
  })

  it('should return default color for invalid plan', () => {
    const color = getPlanBadgeColor('INVALID' as any)
    expect(color).toBe('bg-gray-500')
  })

  it('should return valid Tailwind classes', () => {
    const plans: Array<'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'> = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
    plans.forEach(plan => {
      const color = getPlanBadgeColor(plan)
      expect(color).toMatch(/^bg-\w+-\d+$/)
    })
  })
})

describe('getPlanGradient', () => {
  it('should return correct gradient for FREE plan', () => {
    const gradient = getPlanGradient('FREE')
    expect(gradient).toContain('from-gray')
    expect(gradient).toContain('to-gray')
  })

  it('should return correct gradient for BASIC plan', () => {
    const gradient = getPlanGradient('BASIC')
    expect(gradient).toContain('from-blue')
    expect(gradient).toContain('to-cyan')
  })

  it('should return correct gradient for PREMIUM plan', () => {
    const gradient = getPlanGradient('PREMIUM')
    expect(gradient).toContain('from-purple')
    expect(gradient).toContain('to-pink')
  })

  it('should return correct gradient for ENTERPRISE plan', () => {
    const gradient = getPlanGradient('ENTERPRISE')
    expect(gradient).toContain('from-amber')
    expect(gradient).toContain('to-orange')
  })

  it('should return default gradient for invalid plan', () => {
    const gradient = getPlanGradient('INVALID' as any)
    expect(gradient).toContain('from-gray')
  })

  it('should include "bg-gradient-to-r" in all gradients', () => {
    const plans: Array<'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'> = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
    plans.forEach(plan => {
      const gradient = getPlanGradient(plan)
      expect(gradient).toContain('bg-gradient-to-r')
    })
  })

  it('should return valid Tailwind gradient classes', () => {
    const plans: Array<'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'> = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
    plans.forEach(plan => {
      const gradient = getPlanGradient(plan)
      expect(gradient).toMatch(/bg-gradient-to-r from-\w+-\d+ to-\w+-\d+/)
    })
  })
})

describe('integration tests', () => {
  it('should work together to build complete plan UI data', () => {
    Object.values(SUBSCRIPTION_PLANS).forEach(plan => {
      const features = buildFeatureList(plan)
      const badgeColor = getPlanBadgeColor(plan.id as any)
      const gradient = getPlanGradient(plan.id as any)
      const credits = formatCredits(plan.monthlyCredits)

      expect(features.length).toBeGreaterThan(0)
      expect(badgeColor).toMatch(/^bg-\w+-\d+$/)
      expect(gradient).toContain('bg-gradient-to-r')
      expect(credits).toBeTruthy()
    })
  })

  it('should provide consistent UI data for all plans', () => {
    const plans: Array<'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'> = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
    
    plans.forEach(planId => {
      const config = SUBSCRIPTION_PLANS[planId]
      const features = buildFeatureList(config)
      const badge = getPlanBadgeColor(planId)
      const gradient = getPlanGradient(planId)

      // All UI helpers should return valid data
      expect(features).toBeDefined()
      expect(badge).toBeDefined()
      expect(gradient).toBeDefined()

      // Higher tiers should have more features
      if (planId !== 'FREE') {
        const freeFeatures = buildFeatureList(SUBSCRIPTION_PLANS.FREE)
        expect(features.length).toBeGreaterThanOrEqual(freeFeatures.length)
      }
    })
  })
})
