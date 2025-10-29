/**
 * Shared Chat Types
 * Centralized type definitions to eliminate duplication across chat components
 */

export enum ChatIntent {
  NAVIGATE_COURSE = 'navigate_course',
  NAVIGATE_QUIZ = 'navigate_quiz',
  CREATE_QUIZ = 'create_quiz',
  CREATE_COURSE = 'create_course',
  EXPLAIN_CONCEPT = 'explain_concept',
  TROUBLESHOOT = 'troubleshoot',
  SUBSCRIPTION_INFO = 'subscription_info',
  GENERAL_HELP = 'general_help',
  OFF_TOPIC = 'off_topic',
}

export interface ChatAction {
  type: 'view_course' | 'view_quiz' | 'create_quiz' | 'create_course' | 'upgrade_plan' | 'navigate' | 'external_link' | 'take_quiz' | 'view_all_courses'
  label: string
  url?: string
  metadata?: Record<string, any>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  actions?: ChatAction[]
  tokensUsed?: number
  cached?: boolean
}

export interface IntentResult {
  intent: ChatIntent
  confidence: number
  entities: {
    quantity: number
    courseNames?: string[]
    quizTypes?: string[]
    topics?: string[]
    difficulty?: string
  }
}

export interface UserContext {
  userId?: string
  isSubscribed?: boolean
  subscriptionTier?: string
  enrolledCourses?: string[]
  recentTopics?: string[]
}

export interface ChatResponse {
  content: string
  actions?: ChatAction[]
  tokensUsed: number
  cached: boolean
  intent?: ChatIntent
}

export interface SearchOptions {
  topK?: number
  threshold?: number
  userId?: string
  includeUserCourses?: boolean
}

export interface SearchResult {
  document: {
    id: string
    content: string
    metadata: Record<string, any>
  }
  score: number
  relevance: number
}

export interface RateLimitConfig {
  limit: number
  windowHours: number
  resetMessage?: string
}

export interface ChatConfig {
  maxStoredMessages: number
  defaultMessageLimit: number
  defaultContextLimit: number
  subscribedContextLimit: number
  freeMaxTokens: number
  subscribedMaxTokens: number
  cacheEnabled: boolean
  cacheTTL: number
  streamingEnabled: boolean
}
