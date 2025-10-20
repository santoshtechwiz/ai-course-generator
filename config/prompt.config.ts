/**
 * Prompt Configuration
 * 
 * Centralized configuration for AI prompt templates, tones, and structures
 */

export type PromptTone = 'educational' | 'expert' | 'professional' | 'friendly'
export type PromptStructure = 'structured' | 'conversational' | 'formal'

export interface PromptConfig {
  tone: PromptTone
  structure: PromptStructure
  includeExamples: boolean
  includeExplanations: boolean
  maxLength?: number
}

/**
 * Default prompt configurations per feature
 */
export const PROMPT_CONFIGS = {
  'quiz-mcq': {
    basic: {
      tone: 'educational' as PromptTone,
      structure: 'structured' as PromptStructure,
      includeExamples: false,
      includeExplanations: false,
    },
    premium: {
      tone: 'expert' as PromptTone,
      structure: 'structured' as PromptStructure,
      includeExamples: true,
      includeExplanations: true,
    },
  },
  'quiz-code': {
    tone: 'expert' as PromptTone,
    structure: 'structured' as PromptStructure,
    includeExamples: true,
    includeExplanations: true,
  },
  'quiz-openended': {
    tone: 'expert' as PromptTone,
    structure: 'conversational' as PromptStructure,
    includeExamples: false,
    includeExplanations: true,
  },
  'quiz-blanks': {
    tone: 'educational' as PromptTone,
    structure: 'structured' as PromptStructure,
    includeExamples: false,
    includeExplanations: false,
  },
  'quiz-flashcard': {
    tone: 'educational' as PromptTone,
    structure: 'structured' as PromptStructure,
    includeExamples: false,
    includeExplanations: false,
  },
  'quiz-ordering': {
    tone: 'professional' as PromptTone,
    structure: 'structured' as PromptStructure,
    includeExamples: false,
    includeExplanations: true,
  },
  'course-creation': {
    tone: 'expert' as PromptTone,
    structure: 'formal' as PromptStructure,
    includeExamples: true,
    includeExplanations: true,
  },
  'document-quiz': {
    tone: 'professional' as PromptTone,
    structure: 'structured' as PromptStructure,
    includeExamples: false,
    includeExplanations: true,
  },
} as const

/**
 * System message templates by tone
 */
export const SYSTEM_MESSAGE_TEMPLATES = {
  educational: 'You are an AI that generates educational {featureType}.',
  expert: 'You are an expert {role} that {action}.',
  professional: 'You are a professional {role} that {action}.',
  friendly: 'You are a helpful AI assistant that {action}.',
} as const

/**
 * Get prompt config for a feature
 */
export function getPromptConfig(featureKey: string, isPremium: boolean = false): PromptConfig {
  const config = PROMPT_CONFIGS[featureKey as keyof typeof PROMPT_CONFIGS]
  
  if (!config) {
    return {
      tone: 'educational',
      structure: 'structured',
      includeExamples: false,
      includeExplanations: false,
    }
  }
  
  // Some features have basic/premium variants
  if (typeof config === 'object' && 'basic' in config && 'premium' in config) {
    return isPremium ? config.premium : config.basic
  }
  
  return config as PromptConfig
}

export default {
  PROMPT_CONFIGS,
  SYSTEM_MESSAGE_TEMPLATES,
  getPromptConfig,
}
