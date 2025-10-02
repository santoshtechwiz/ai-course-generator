"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { storageManager } from "@/utils/storage-manager"

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  remainingQuestions: number
  lastQuestionTime: number
  lastUserMessage: string
}

interface UseChatStoreReturn {
  // State
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  remainingQuestions: number
  lastQuestionTime: number
  lastUserMessage: string

  // Actions
  sendMessage: (text: string, isRetry?: boolean) => Promise<void>
  clearConversation: () => void
  retryLastMessage: () => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  addMessage: (message: ChatMessage) => void
  updateRemainingQuestions: (count: number) => void
}

const CHAT_STORAGE_KEY = 'courseai_chat_history'
const MAX_STORED_MESSAGES = 50

export function useChatStore(userId: string): UseChatStoreReturn {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    remainingQuestions: 5,
    lastQuestionTime: Date.now(),
    lastUserMessage: ''
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  // Load persisted chat history on mount
  useEffect(() => {
    try {
      const stored = storageManager.getChatHistory(userId)
      if (stored && Array.isArray(stored.messages)) {
        setState(prev => ({
          ...prev,
          messages: stored.messages.slice(-MAX_STORED_MESSAGES),
          lastQuestionTime: stored.lastQuestionTime || Date.now(),
          remainingQuestions: stored.remainingQuestions || 5
        }))
      }
    } catch (error) {
      console.warn('Failed to load chat history:', error)
    }
  }, [userId])

  // Persist chat history when messages change
  useEffect(() => {
    try {
      storageManager.saveChatHistory(userId, {
        messages: state.messages.slice(-MAX_STORED_MESSAGES),
        lastQuestionTime: state.lastQuestionTime,
        remainingQuestions: state.remainingQuestions
      })
    } catch (error) {
      console.warn('Failed to save chat history:', error)
    }
  }, [state.messages, state.lastQuestionTime, state.remainingQuestions, userId])

  // Reset remaining questions every hour
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const hoursSinceLastQuestion = (Date.now() - state.lastQuestionTime) / 3600000
      if (hoursSinceLastQuestion >= 1) {
        setState(prev => ({
          ...prev,
          remainingQuestions: 5
        }))
      }
    }, 60000) // Check every minute

    return () => clearInterval(checkInterval)
  }, [state.lastQuestionTime])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const sendMessage = useCallback(async (text: string, isRetry: boolean = false) => {
    if (!text?.trim()) return

    // Track last user message for retry functionality
    if (!isRetry) {
      setState(prev => ({ ...prev, lastUserMessage: text.trim() }))
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now()
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null
    }))

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text.trim(), userId }),
        signal: abortControllerRef.current.signal,
      })

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
      }

      const data = await res.json()
      const assistantText = data?.assistant || data?.message || getFallbackResponse(text)

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: assistantText,
        timestamp: Date.now()
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        remainingQuestions: Math.max(0, prev.remainingQuestions - 1),
        lastQuestionTime: Date.now(),
        isLoading: false
      }))

    } catch (err: any) {
      if (err.name === 'AbortError') return // Request was cancelled

      const errorMessage = err.message || "I couldn't reach the chat service right now."
      const fallbackResponse = getFallbackResponse(text)

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: fallbackResponse,
          timestamp: Date.now()
        }],
        error: errorMessage,
        isLoading: false
      }))
    } finally {
      abortControllerRef.current = null
    }
  }, [userId])

  const clearConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
      lastUserMessage: ''
    }))
  }, [])

  const retryLastMessage = useCallback(() => {
    if (state.lastUserMessage) {
      // Remove last assistant message if it was an error
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.role === 'user' || !m.content.includes('Sorry'))
      }))
      sendMessage(state.lastUserMessage, true)
    }
  }, [state.lastUserMessage, sendMessage])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const addMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }))
  }, [])

  const updateRemainingQuestions = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      remainingQuestions: count
    }))
  }, [])

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    remainingQuestions: state.remainingQuestions,
    lastQuestionTime: state.lastQuestionTime,
    lastUserMessage: state.lastUserMessage,
    sendMessage,
    clearConversation,
    retryLastMessage,
    setError,
    setLoading,
    addMessage,
    updateRemainingQuestions
  }
}

/**
 * Enterprise-grade fallback response when AI service is unavailable
 * Professional messaging with clear navigation options
 */
function getFallbackResponse(userMessage: string): string {
  // Check for greetings
  const lowerMsg = userMessage.toLowerCase()
  if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('how are you')) {
    return `Welcome to CourseAI 👋 Your intelligent learning assistant. I can help you explore courses, quizzes, and subscriptions.

**What I Can Help With:**
- 📚 Course discovery and recommendations
- 🎯 Quiz exploration and tracking
- 💎 Subscription and account information
- ✨ Platform features and guidance

How can I assist you today?`
  }

  return `I'm currently experiencing connectivity issues, but I'm here to help with CourseAI!

**Quick Actions:**
- 📚 [Browse Courses](/dashboard/courses) - Explore our course catalog
- 🎯 [View Quizzes](/dashboard/quizzes) - Test your knowledge
- ✨ [Create Content](/dashboard/courses/create) - Build your own course

Please try your question again in a moment. I specialize in helping you find courses, quizzes, and platform information.`
}
