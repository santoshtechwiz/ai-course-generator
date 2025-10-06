/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import SUBSCRIPTION_PLANS, { 
  getPlansArray, 
  findPlanById,
  getMaxQuestions,
  hasReachedQuestionLimit,
  type SubscriptionPlanType,
  type PlanConfig 
} from '@/types/subscription-plans'

describe('SUBSCRIPTION_PLANS', () => {
  it('should export a Record with all plan types', () => {
    expect(SUBSCRIPTION_PLANS).toBeDefined()
    expect(typeof SUBSCRIPTION_PLANS).toBe('object')
    expect(SUBSCRIPTION_PLANS.FREE).toBeDefined()
    expect(SUBSCRIPTION_PLANS.BASIC).toBeDefined()
    expect(SUBSCRIPTION_PLANS.PREMIUM).toBeDefined()
    expect(SUBSCRIPTION_PLANS.ENTERPRISE).toBeDefined()
  })

  it('should have correct structure for each plan', () => {
    const requiredKeys = [
      'id', 'name', 'price', 'popular', 'maxQuestionsPerQuiz',
      'monthlyCredits', 'courseCreation', 'pdfDownloads',
      'contentCreation', 'mcqGenerator', 'prioritySupport', 'aiAccuracy'
    ]

    Object.values(SUBSCRIPTION_PLANS).forEach((plan) => {
      requiredKeys.forEach((key) => {
        expect(plan).toHaveProperty(key)
      })
    })
  })

  it('should have correct plan hierarchy prices', () => {
    expect(SUBSCRIPTION_PLANS.FREE.price).toBe(0)
    expect(SUBSCRIPTION_PLANS.BASIC.price).toBeGreaterThan(0)
    expect(SUBSCRIPTION_PLANS.PREMIUM.price).toBeGreaterThan(SUBSCRIPTION_PLANS.BASIC.price)
    expect(SUBSCRIPTION_PLANS.ENTERPRISE.price).toBeGreaterThan(SUBSCRIPTION_PLANS.PREMIUM.price)
  })
})

describe('getPlansArray', () => {
  it('should convert Record to array', () => {
    const plans = getPlansArray()
    expect(Array.isArray(plans)).toBe(true)
    expect(plans.length).toBe(4)
  })

  it('should maintain all plan properties', () => {
    const plans = getPlansArray()
    plans.forEach((plan) => {
      expect(plan.id).toBeDefined()
      expect(plan.name).toBeDefined()
      expect(plan.price).toBeDefined()
    })
  })
})

describe('findPlanById', () => {
  it('should find plan by valid ID', () => {
    const plan = findPlanById('PREMIUM')
    expect(plan).toBeDefined()
    expect(plan?.id).toBe('PREMIUM')
    expect(plan?.name).toBe('Premium')
  })

  it('should return undefined for invalid ID', () => {
    const plan = findPlanById('INVALID_PLAN' as any)
    expect(plan).toBeUndefined()
  })

  it('should find all plan types', () => {
    const planIds: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
    planIds.forEach((id) => {
      const plan = findPlanById(id)
      expect(plan).toBeDefined()
      expect(plan?.id).toBe(id)
    })
  })
})

describe('Direct plan access', () => {
  it('should access plan config directly from Record', () => {
    const config = SUBSCRIPTION_PLANS.PREMIUM
    expect(config).toBeDefined()
    expect(config.id).toBe('PREMIUM')
    expect(config.mcqGenerator).toBe(true)
  })

  it('should access all plans via Record', () => {
    expect(SUBSCRIPTION_PLANS.FREE).toBeDefined()
    expect(SUBSCRIPTION_PLANS.BASIC).toBeDefined()
    expect(SUBSCRIPTION_PLANS.PREMIUM).toBeDefined()
    expect(SUBSCRIPTION_PLANS.ENTERPRISE).toBeDefined()
  })
})

describe('Plan hierarchy via Object.keys', () => {
  it('should have all plan types as keys', () => {
    const keys = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanType[]
    expect(keys).toContain('FREE')
    expect(keys).toContain('BASIC')
    expect(keys).toContain('PREMIUM')
    expect(keys).toContain('ENTERPRISE')
  })

  it('should have 4 plan types', () => {
    const keys = Object.keys(SUBSCRIPTION_PLANS)
    expect(keys.length).toBe(4)
  })
})

describe('Plan comparison via price', () => {
  it('should have increasing prices', () => {
    expect(SUBSCRIPTION_PLANS.FREE.price).toBeLessThan(SUBSCRIPTION_PLANS.BASIC.price)
    expect(SUBSCRIPTION_PLANS.BASIC.price).toBeLessThan(SUBSCRIPTION_PLANS.PREMIUM.price)
    expect(SUBSCRIPTION_PLANS.PREMIUM.price).toBeLessThan(SUBSCRIPTION_PLANS.ENTERPRISE.price)
  })

  it('should allow price-based comparison', () => {
    const premiumPrice = SUBSCRIPTION_PLANS.PREMIUM.price
    const basicPrice = SUBSCRIPTION_PLANS.BASIC.price
    expect(premiumPrice > basicPrice).toBe(true)
  })

  it('should have FREE at price 0', () => {
    expect(SUBSCRIPTION_PLANS.FREE.price).toBe(0)
  })
})

describe('getMaxQuestions', () => {
  it('should return correct maxQuestionsPerQuiz for each plan', () => {
    expect(getMaxQuestions('FREE')).toBe(SUBSCRIPTION_PLANS.FREE.maxQuestionsPerQuiz)
    expect(getMaxQuestions('BASIC')).toBe(SUBSCRIPTION_PLANS.BASIC.maxQuestionsPerQuiz)
    expect(getMaxQuestions('PREMIUM')).toBe(SUBSCRIPTION_PLANS.PREMIUM.maxQuestionsPerQuiz)
  })

  it('should return correct max questions for ENTERPRISE plan', () => {
    expect(getMaxQuestions('ENTERPRISE')).toBe(20)
  })

  it('should handle numeric values', () => {
    const freeMax = getMaxQuestions('FREE')
    if (typeof freeMax === 'number') {
      expect(freeMax).toBeGreaterThan(0)
    }
  })
})

describe('hasReachedQuestionLimit', () => {
  it('should return correct limit check for ENTERPRISE plan (20 max)', () => {
    expect(hasReachedQuestionLimit('ENTERPRISE', 19)).toBe(false)
    expect(hasReachedQuestionLimit('ENTERPRISE', 20)).toBe(true)
    expect(hasReachedQuestionLimit('ENTERPRISE', 21)).toBe(true)
  })

  it('should return true when current questions >= max', () => {
    const freeMax = SUBSCRIPTION_PLANS.FREE.maxQuestionsPerQuiz as number
    expect(hasReachedQuestionLimit('FREE', freeMax)).toBe(true)
    expect(hasReachedQuestionLimit('FREE', freeMax + 1)).toBe(true)
  })

  it('should return false when current questions < max', () => {
    const freeMax = SUBSCRIPTION_PLANS.FREE.maxQuestionsPerQuiz as number
    expect(hasReachedQuestionLimit('FREE', freeMax - 1)).toBe(false)
    expect(hasReachedQuestionLimit('FREE', 0)).toBe(false)
  })

  it('should handle BASIC and PREMIUM plans correctly', () => {
    const basicMax = SUBSCRIPTION_PLANS.BASIC.maxQuestionsPerQuiz as number
    const premiumMax = SUBSCRIPTION_PLANS.PREMIUM.maxQuestionsPerQuiz as number

    expect(hasReachedQuestionLimit('BASIC', basicMax - 1)).toBe(false)
    expect(hasReachedQuestionLimit('BASIC', basicMax)).toBe(true)

    expect(hasReachedQuestionLimit('PREMIUM', premiumMax - 1)).toBe(false)
    expect(hasReachedQuestionLimit('PREMIUM', premiumMax)).toBe(true)
  })
})

describe('plan feature flags', () => {
  it('should grant all features to higher tier plans', () => {
    const enterprise = SUBSCRIPTION_PLANS.ENTERPRISE
    expect(enterprise.mcqGenerator).toBe(true)
    expect(enterprise.courseCreation).toBe(true)
    expect(enterprise.pdfDownloads).toBe(true)
    expect(enterprise.videoQuiz).toBe(true)
    expect(enterprise.prioritySupport).toBe(true)
  })

  it('should have appropriate feature restrictions for FREE plan', () => {
    const free = SUBSCRIPTION_PLANS.FREE
    expect(free.mcqGenerator).toBe(true) // Basic feature
    expect(free.pdfDownloads).toBe(false) // Restricted
    expect(typeof free.maxQuestionsPerQuiz).toBe('number')
    expect(free.maxQuestionsPerQuiz).toBeLessThan(SUBSCRIPTION_PLANS.BASIC.maxQuestionsPerQuiz as number)
  })

  it('should have increasing monthly credits with plan tier', () => {
    expect(SUBSCRIPTION_PLANS.FREE.monthlyCredits).toBeLessThan(
      SUBSCRIPTION_PLANS.BASIC.monthlyCredits as number
    )
    expect(SUBSCRIPTION_PLANS.BASIC.monthlyCredits).toBeLessThan(
      SUBSCRIPTION_PLANS.PREMIUM.monthlyCredits as number
    )
  })
})

describe('type safety', () => {
  it('should only accept valid SubscriptionPlanType', () => {
    // This is a compile-time test - if it compiles, the types are correct
    const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
    validPlans.forEach((plan) => {
      expect(SUBSCRIPTION_PLANS[plan]).toBeDefined()
    })
  })

  it('should have correct PlanConfig structure', () => {
    const planConfig: PlanConfig = SUBSCRIPTION_PLANS.PREMIUM
    
    // These should not throw type errors
    expect(typeof planConfig.id).toBe('string')
    expect(typeof planConfig.name).toBe('string')
    expect(typeof planConfig.price).toBe('number')
    expect(['number', 'string'].includes(typeof planConfig.maxQuestionsPerQuiz)).toBe(true)
    expect(typeof planConfig.monthlyCredits).toBe('number')
    expect(typeof planConfig.mcqGenerator).toBe('boolean')
    expect(typeof planConfig.courseCreation).toBe('boolean')
    expect(typeof planConfig.pdfDownloads).toBe('boolean')
  })
})
