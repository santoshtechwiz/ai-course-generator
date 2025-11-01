/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import SubscriptionPlanType, { 
  getPlansArray, 
  findPlanById,
  getMaxQuestions,
  hasReachedQuestionLimit,
  type SubscriptionPlanType,
  type PlanConfig 
} from '@/types/subscription-plans'

describe('SubscriptionPlanType', () => {
  it('should export a Record with all plan types', () => {
    expect(SubscriptionPlanType).toBeDefined()
    expect(typeof SubscriptionPlanType).toBe('object')
    expect(SubscriptionPlanType.FREE).toBeDefined()
    expect(SubscriptionPlanType.BASIC).toBeDefined()
    expect(SubscriptionPlanType.PREMIUM).toBeDefined()
    expect(SubscriptionPlanType.ENTERPRISE).toBeDefined()
  })

  it('should have correct structure for each plan', () => {
    const requiredKeys = [
      'id', 'name', 'price', 'popular', 'maxQuestionsPerQuiz',
      'monthlyCredits', 'courseCreation', 'pdfDownloads',
      'contentCreation', 'mcqGenerator', 'prioritySupport', 'aiAccuracy'
    ]

    Object.values(SubscriptionPlanType).forEach((plan) => {
      requiredKeys.forEach((key) => {
        expect(plan).toHaveProperty(key)
      })
    })
  })

  it('should have correct plan hierarchy prices', () => {
    expect(SubscriptionPlanType.FREE.price).toBe(0)
    expect(SubscriptionPlanType.BASIC.price).toBeGreaterThan(0)
    expect(SubscriptionPlanType.PREMIUM.price).toBeGreaterThan(SubscriptionPlanType.BASIC.price)
    expect(SubscriptionPlanType.ENTERPRISE.price).toBeGreaterThan(SubscriptionPlanType.PREMIUM.price)
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
    const config = SubscriptionPlanType.PREMIUM
    expect(config).toBeDefined()
    expect(config.id).toBe('PREMIUM')
    expect(config.mcqGenerator).toBe(true)
  })

  it('should access all plans via Record', () => {
    expect(SubscriptionPlanType.FREE).toBeDefined()
    expect(SubscriptionPlanType.BASIC).toBeDefined()
    expect(SubscriptionPlanType.PREMIUM).toBeDefined()
    expect(SubscriptionPlanType.ENTERPRISE).toBeDefined()
  })
})

describe('Plan hierarchy via Object.keys', () => {
  it('should have all plan types as keys', () => {
    const keys = Object.keys(SubscriptionPlanType) as SubscriptionPlanType[]
    expect(keys).toContain('FREE')
    expect(keys).toContain('BASIC')
    expect(keys).toContain('PREMIUM')
    expect(keys).toContain('ENTERPRISE')
  })

  it('should have 4 plan types', () => {
    const keys = Object.keys(SubscriptionPlanType)
    expect(keys.length).toBe(4)
  })
})

describe('Plan comparison via price', () => {
  it('should have increasing prices', () => {
    expect(SubscriptionPlanType.FREE.price).toBeLessThan(SubscriptionPlanType.BASIC.price)
    expect(SubscriptionPlanType.BASIC.price).toBeLessThan(SubscriptionPlanType.PREMIUM.price)
    expect(SubscriptionPlanType.PREMIUM.price).toBeLessThan(SubscriptionPlanType.ENTERPRISE.price)
  })

  it('should allow price-based comparison', () => {
    const premiumPrice = SubscriptionPlanType.PREMIUM.price
    const basicPrice = SubscriptionPlanType.BASIC.price
    expect(premiumPrice > basicPrice).toBe(true)
  })

  it('should have FREE at price 0', () => {
    expect(SubscriptionPlanType.FREE.price).toBe(0)
  })
})

describe('getMaxQuestions', () => {
  it('should return correct maxQuestionsPerQuiz for each plan', () => {
    expect(getMaxQuestions('FREE')).toBe(SubscriptionPlanType.FREE.maxQuestionsPerQuiz)
    expect(getMaxQuestions('BASIC')).toBe(SubscriptionPlanType.BASIC.maxQuestionsPerQuiz)
    expect(getMaxQuestions('PREMIUM')).toBe(SubscriptionPlanType.PREMIUM.maxQuestionsPerQuiz)
  })

  it('should return correct max questions for ENTERPRISE plan', () => {
    expect(getMaxQuestions('ENTERPRISE')).toBe(15)
  })

  it('should handle numeric values', () => {
    const freeMax = getMaxQuestions('FREE')
    if (typeof freeMax === 'number') {
      expect(freeMax).toBeGreaterThan(0)
    }
  })
})

describe('hasReachedQuestionLimit', () => {
  it('should return correct limit check for ENTERPRISE plan (15 max)', () => {
    expect(hasReachedQuestionLimit('ENTERPRISE', 14)).toBe(false)
    expect(hasReachedQuestionLimit('ENTERPRISE', 15)).toBe(true)
    expect(hasReachedQuestionLimit('ENTERPRISE', 16)).toBe(true)
  })

  it('should return true when current questions >= max', () => {
    const freeMax = SubscriptionPlanType.FREE.maxQuestionsPerQuiz as number
    expect(hasReachedQuestionLimit('FREE', freeMax)).toBe(true)
    expect(hasReachedQuestionLimit('FREE', freeMax + 1)).toBe(true)
  })

  it('should return false when current questions < max', () => {
    const freeMax = SubscriptionPlanType.FREE.maxQuestionsPerQuiz as number
    expect(hasReachedQuestionLimit('FREE', freeMax - 1)).toBe(false)
    expect(hasReachedQuestionLimit('FREE', 0)).toBe(false)
  })

  it('should handle BASIC and PREMIUM plans correctly', () => {
    const basicMax = SubscriptionPlanType.BASIC.maxQuestionsPerQuiz as number
    const premiumMax = SubscriptionPlanType.PREMIUM.maxQuestionsPerQuiz as number

    expect(hasReachedQuestionLimit('BASIC', basicMax - 1)).toBe(false)
    expect(hasReachedQuestionLimit('BASIC', basicMax)).toBe(true)

    expect(hasReachedQuestionLimit('PREMIUM', premiumMax - 1)).toBe(false)
    expect(hasReachedQuestionLimit('PREMIUM', premiumMax)).toBe(true)
  })
})

describe('plan feature flags', () => {
  it('should grant all features to higher tier plans', () => {
    const enterprise = SubscriptionPlanType.ENTERPRISE
    expect(enterprise.mcqGenerator).toBe(true)
    expect(enterprise.courseCreation).toBe(true)
    expect(enterprise.pdfDownloads).toBe(true)
    expect(enterprise.videoQuiz).toBe(true)
    expect(enterprise.prioritySupport).toBe(true)
  })

  it('should have appropriate feature restrictions for FREE plan', () => {
    const free = SubscriptionPlanType.FREE
    expect(free.mcqGenerator).toBe(true) // Basic feature
    expect(free.pdfDownloads).toBe(false) // Restricted
    expect(typeof free.maxQuestionsPerQuiz).toBe('number')
    expect(free.maxQuestionsPerQuiz).toBeLessThan(SubscriptionPlanType.BASIC.maxQuestionsPerQuiz as number)
  })

  it('should have increasing monthly credits with plan tier', () => {
    expect(SubscriptionPlanType.FREE.monthlyCredits).toBeLessThan(
      SubscriptionPlanType.BASIC.monthlyCredits as number
    )
    expect(SubscriptionPlanType.BASIC.monthlyCredits).toBeLessThan(
      SubscriptionPlanType.PREMIUM.monthlyCredits as number
    )
  })
})

describe('type safety', () => {
  it('should only accept valid SubscriptionPlanType', () => {
    // This is a compile-time test - if it compiles, the types are correct
    const validPlans: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
    validPlans.forEach((plan) => {
      expect(SubscriptionPlanType[plan]).toBeDefined()
    })
  })

  it('should have correct PlanConfig structure', () => {
    const planConfig: PlanConfig = SubscriptionPlanType.PREMIUM
    
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
