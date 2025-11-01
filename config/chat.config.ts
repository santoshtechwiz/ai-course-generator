/**
 * Chat Configuration
 * Centralized configuration to replace magic numbers
 */

import type { RateLimitConfig, ChatConfig } from '@/types/chat.types'

export const CHAT_CONFIG: ChatConfig = {
  // Message history
  maxStoredMessages: 50,
  defaultMessageLimit: 5, // Default questions per hour for free users
  
  // Context limits for RAG
  defaultContextLimit: 3,
  subscribedContextLimit: 5,
  
  // Token limits (reduced for concise teacher-style responses)
  freeMaxTokens: 150, // 2-3 sentence responses
  subscribedMaxTokens: 200, // Slightly longer for paid users
  
  // Caching
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour in seconds
  
  // Streaming
  streamingEnabled: true,
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    limit: 10,
    windowHours: 1,
    resetMessage: 'You\'ve reached the free tier limit. Upgrade to Pro for unlimited questions!',
  },
  subscribed: {
    limit: 100,
    windowHours: 1,
    resetMessage: 'Rate limit reached. Please try again in a few minutes.',
  },
}

export const WELCOME_SUGGESTIONS = [
  'Show me courses on web development',
  'Create a quiz on JavaScript basics',
  'Explain what is machine learning',
  'How do I upgrade my plan?',
]

export const OFF_TOPIC_RESPONSE = `I'm your virtual teacher for CourseAI! I only help with educational topics. I can't answer questions about ${['weather', 'news', 'entertainment', 'recipes', 'shopping'].join(', ')} etc.

🎓 **Ask me about:**
• Course recommendations - "Show me Python courses"
• Learning concepts - "Explain machine learning"
• Quiz creation - "Create a JavaScript quiz"
• Platform features - "How do I upgrade?"

What would you like to study today?`
