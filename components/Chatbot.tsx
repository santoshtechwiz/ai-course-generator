"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, X, Send, Loader2, BrainCircuit, Crown, AlertCircle, HelpCircle, Copy, Check, Trash2, RotateCcw, Sparkles, ExternalLink, ChevronRight, BookOpen, Target, Code2, Search, Plus, ArrowRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSubscription } from "@/modules/auth/hooks/useSubscription"
import { storageManager } from "@/utils/storage-manager"



// Improve the animation variants for smoother transitions
const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
    },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

// Improve the chat container animation
const chatContainerVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Replace the existing AnimatedQuestions component with this improved version - Memoized
const AnimatedQuestions = React.memo(() => {
  const questions = useMemo(() => [
    "How do I enroll in a course?",
    "What are the prerequisites for Machine Learning?",
    "Can you explain the concept of data normalization?",
    "How do I submit my assignments?",
    "What's the difference between supervised and unsupervised learning?",
    "How can I improve my coding skills?",
  ], [])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % questions.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [questions.length])

  return (
    <div className="h-8 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-sm text-muted-foreground text-center"
        >
          {questions[currentQuestionIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
})

AnimatedQuestions.displayName = 'AnimatedQuestions'

// Memoized message bubble component with copy functionality
const MessageBubble = React.memo(({ 
  message, 
  index, 
  onCopy, 
  copiedMessageId 
}: { 
  message: any; 
  index: number; 
  onCopy: (text: string, id: string) => void;
  copiedMessageId: string | null;
}) => {
  const isCopied = copiedMessageId === message.id
  
  return (
    <motion.div
      key={message.id}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={messageVariants}
      className={cn("flex group", message.role === "user" ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "flex gap-2 max-w-[85%]",
          message.role === "user" ? "flex-row-reverse" : "flex-row",
          message.role === "user" ? "items-end" : "items-start",
        )}
      >
        <Avatar className="w-7 h-7 shrink-0">
          {message.role === "user" ? (
            <AvatarImage src="/user-avatar.png" alt="User" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-3.5 w-3.5 text-primary" />
            </div>
          )}
          <AvatarFallback>{message.role === "user" ? "U" : "AI"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1 min-w-0">
          <div
            className={cn(
              "px-3 py-2 rounded-lg text-sm relative",
              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
            )}
          >
            {message.content ? (
              <ReactMarkdown 
                className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="text-red-500 italic text-xs">
                Message could not be displayed. Please try again.
              </div>
            )}
          </div>
          {message.role === "assistant" && message.content && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(message.content, message.id)}
              className={cn(
                "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                message.role === "user" ? "self-end" : "self-start"
              )}
              aria-label="Copy message"
            >
              {isCopied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
})

MessageBubble.displayName = 'MessageBubble'

interface ChatbotProps {
  userId: string
}

// Enhanced ReactMarkdown components with colors and icons - Memoized outside component for performance
const markdownComponents: Partial<Components> = {
  a: ({ node, href, children, ...props }) => {
    if (!href) return <span>{children}</span>
    const isExternal = href.startsWith('http') && typeof window !== 'undefined' && !href.includes(window.location.hostname)
    const linkText = String(children)
    
    // Determine icon based on link content
    let Icon = ExternalLink
    if (linkText.includes('Quiz') || linkText.includes('Take Quiz')) Icon = Target
    else if (linkText.includes('Course') || linkText.includes('View Course')) Icon = BookOpen
    else if (linkText.includes('Create') || linkText.includes('Build')) Icon = Plus
    else if (linkText.includes('Code') || linkText.includes('Programming')) Icon = Code2
    else if (linkText.includes('Explore') || linkText.includes('Browse')) Icon = Search
    
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : '_self'}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-all duration-200 hover:bg-primary/5 px-2 py-1 rounded-md group"
        {...props}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
        <span className="group-hover:underline">{children}</span>
        {isExternal && <ExternalLink className="h-3 w-3 opacity-60" />}
      </a>
    )
  },
  h1: ({ node, children, ...props }) => (
    <h1 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2 border-b border-border/30 pb-2" {...props}>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }) => (
    <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2" {...props}>
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }) => {
    const headingText = String(children)
    let Icon = ChevronRight
    let bgColor = 'bg-blue-50 dark:bg-blue-900/20'
    let textColor = 'text-blue-700 dark:text-blue-300'
    let borderColor = 'border-blue-200 dark:border-blue-700'
    
    if (headingText.includes('Quiz')) {
      Icon = Target
      bgColor = 'bg-purple-50 dark:bg-purple-900/20'
      textColor = 'text-purple-700 dark:text-purple-300'
      borderColor = 'border-purple-200 dark:border-purple-700'
    } else if (headingText.includes('Course')) {
      Icon = BookOpen
      bgColor = 'bg-green-50 dark:bg-green-900/20'
      textColor = 'text-green-700 dark:text-green-300'
      borderColor = 'border-green-200 dark:border-green-700'
    } else if (headingText.includes('Key Concepts') || headingText.includes('Concepts')) {
      Icon = Sparkles
      bgColor = 'bg-orange-50 dark:bg-orange-900/20'
      textColor = 'text-orange-700 dark:text-orange-300'
      borderColor = 'border-orange-200 dark:border-orange-700'
    }
    
    return (
      <div className={`${bgColor} ${borderColor} border rounded-lg p-3 mb-3 mt-4`}>
        <h3 className={`text-sm font-semibold ${textColor} flex items-center gap-2 mb-2`} {...props}>
          <Icon className="h-4 w-4" />
          {children}
        </h3>
      </div>
    )
  },
  p: ({ node, children, ...props }) => {
    const text = String(children)
    
    // Style special paragraphs
    if (text.includes('Practice might help') || text.includes('comprehensive coverage')) {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-2 mb-2 text-sm text-blue-700 dark:text-blue-300 italic" {...props}>
          💡 {children}
        </div>
      )
    }
    
    return (
      <p className="mb-2 last:mb-0 text-sm leading-relaxed" {...props}>
        {children}
      </p>
    )
  },
  ul: ({ node, children, ...props }) => (
    <ul className="space-y-2 my-3" {...props}>
      {children}
    </ul>
  ),
  li: ({ node, children, ...props }) => {
    const text = String(children)
    let bulletColor = 'text-blue-500'
    let bullet = '•'
    
    // Different bullets and colors based on content
    if (text.includes('Quiz') || text.includes('Take Quiz')) {
      bullet = '🎯'
      bulletColor = 'text-purple-500'
    } else if (text.includes('Course') || text.includes('View Course')) {
      bullet = '📚'
      bulletColor = 'text-green-500'
    } else if (text.includes('Create')) {
      bullet = '✨'
      bulletColor = 'text-orange-500'
    } else if (text.includes('Explore') || text.includes('Browse')) {
      bullet = '🔍'
      bulletColor = 'text-blue-500'
    }
    
    return (
      <li className="flex items-start gap-2 text-sm leading-relaxed" {...props}>
        <span className={`${bulletColor} font-medium mt-0.5 flex-shrink-0`}>{bullet}</span>
        <div className="flex-1">{children}</div>
      </li>
    )
  },
  strong: ({ node, children, ...props }) => (
    <strong className="font-semibold text-foreground bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded text-xs" {...props}>
      {children}
    </strong>
  ),
  hr: ({ node, ...props }) => (
    <div className="flex items-center gap-2 my-4" {...props}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
        <div className="w-1 h-1 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-1 h-1 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-border via-transparent to-transparent" />
    </div>
  ),
  blockquote: ({ node, children, ...props }) => (
    <blockquote className="border-l-4 border-primary/30 bg-primary/5 pl-4 py-2 my-3 italic text-sm" {...props}>
      {children}
    </blockquote>
  ),
  code: ({ node, children, ...props }) => (
    <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
      {children}
    </code>
  ),
}

export function Chatbot({ userId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remainingQuestions, setRemainingQuestions] = useState(5)
  const [lastQuestionTime, setLastQuestionTime] = useState(Date.now())
  const [showTooltip, setShowTooltip] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [lastUserMessage, setLastUserMessage] = useState<string>('')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const { subscription } = useSubscription()
  const { toast } = useToast()

  // Simplified message sending - API returns JSON directly
  const sendMessage = useCallback(async (text: string, isRetry: boolean = false) => {
    if (!text?.trim()) return

    // Track last user message for retry functionality
    if (!isRetry) {
      setLastUserMessage(text.trim())
    }

    const userMessage = { id: `msg_${Date.now()}`, role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

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
      const assistantText = data?.assistant || data?.message || 'No response available'
      
      setMessages(prev => [...prev, { 
        id: `msg_${Date.now()}_assistant`, 
        role: 'assistant', 
        content: assistantText 
      }])
      
      setRemainingQuestions(prev => Math.max(0, prev - 1))
      setLastQuestionTime(Date.now())
    } catch (err: any) {
      if (err.name === 'AbortError') return // Request was cancelled
      
      const errorMessage = err.message || "I couldn't reach the chat service right now."
      setError(errorMessage)
      setMessages(prev => [...prev, { 
        id: `err_${Date.now()}`, 
        role: 'assistant', 
        content: `Sorry, ${errorMessage}` 
      }])
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [userId, toast])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Reset remaining questions every hour
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const hoursSinceLastQuestion = (Date.now() - lastQuestionTime) / 3600000
      if (hoursSinceLastQuestion >= 1) {
        setRemainingQuestions(5)
      }
    }, 60000) // Check every minute

    return () => clearInterval(checkInterval)
  }, [lastQuestionTime])

  // Auto-scroll to bottom when new messages arrive - optimized
  useEffect(() => {
    if (!scrollAreaRef.current || messages.length === 0) return

    const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
    if (!scrollContainer) return

    // Use requestAnimationFrame for smoother scrolling
    const scrollTimer = requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    })

    return () => cancelAnimationFrame(scrollTimer)
  }, [messages.length]) // Only depend on length, not entire messages array

  // Show tooltip for new users - only once
  useEffect(() => {
    const userPrefs = storageManager.getUserPreferences()
    if (!userPrefs.hasSeenChatTooltip) {
      setShowTooltip(true)
      const timer = setTimeout(() => {
        setShowTooltip(false)
        storageManager.saveUserPreferences({ hasSeenChatTooltip: true })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Memoized subscription check - fixed dependency
  const canUseChat = useCallback(() => {
    if (!subscription) return false
    if (!subscription.isSubscribed) return remainingQuestions > 0
    return true
  }, [subscription?.isSubscribed, remainingQuestions])

  // Copy message to clipboard
  const copyToClipboard = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      })
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }, [toast])

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([])
    setError(null)
    setLastUserMessage('')
    toast({
      title: "Conversation cleared",
      description: "Starting fresh!",
    })
  }, [toast])

  // Retry last message
  const retryLastMessage = useCallback(() => {
    if (lastUserMessage) {
      // Remove last assistant message if it was an error
      setMessages(prev => {
        const filtered = prev.filter(m => m.role === 'user' || !m.content.includes('Sorry'))
        return filtered
      })
      sendMessage(lastUserMessage, true)
    }
  }, [lastUserMessage, sendMessage])

  // Simplified form submit handler
  const handleChatSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!canUseChat() || !input.trim() || isLoading) return
      sendMessage(input)
    },
    [canUseChat, input, isLoading, sendMessage],
  )

  const toggleChat = useCallback(() => setIsOpen(prev => !prev), [])

  // Dynamic contextual suggestions based on conversation
  const suggestions = useMemo(() => {
    const lastMessage = messages[messages.length - 1]
    const hasCourseMention = lastMessage?.content?.toLowerCase().includes('course')
    const hasQuizMention = lastMessage?.content?.toLowerCase().includes('quiz')
    
    if (messages.length === 0) {
      return [
        "Show me Python courses",
        "What can I learn here?",
        "Help me find JavaScript tutorials",
        "Show available quizzes",
      ]
    }
    
    if (hasCourseMention) {
      return [
        "How do I enroll?",
        "Show similar courses",
        "What's the difficulty level?",
        "Create a custom course",
      ]
    }
    
    if (hasQuizMention) {
      return [
        "Take this quiz",
        "Create a new quiz",
        "Show my quiz results",
        "More quiz topics",
      ]
    }
    
    return [
      "Find courses for me",
      "Create a quiz",
      "How do I get started?",
      "Show recommendations",
    ]
  }, [messages])

  // Handle suggestion click - simplified
  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (!canUseChat()) return
    setInput(suggestion)
    sendMessage(suggestion)
  }, [canUseChat, sendMessage])

  // Format time remaining until reset
  const formatTimeRemaining = () => {
    const timeElapsed = Date.now() - lastQuestionTime
    const timeRemaining = 3600000 - timeElapsed

    if (timeRemaining <= 0) return "Available now"

    const minutes = Math.floor(timeRemaining / 60000)
    const seconds = Math.floor((timeRemaining % 60000) / 1000)

    return `${minutes}m ${seconds}s`
  }

  // Update the return statement in the Chatbot component to use the improved animations
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={chatContainerVariants}
            className="relative"
          >
            <Card className="w-[350px] sm:w-[400px] h-[500px] flex flex-col shadow-lg border-primary/20 rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <BrainCircuit className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-medium">Course AI Assistant</CardTitle>
                    {messages.length > 0 && (
                      <span className="text-xs text-muted-foreground">{messages.length} messages</span>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={remainingQuestions > 0 ? "outline" : "destructive"}
                          className="ml-2 text-xs font-normal cursor-help"
                        >
                          {subscription?.isSubscribed ? "PREMIUM" : `${remainingQuestions} left`}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {subscription?.isSubscribed
                          ? "Unlimited questions with your Pro subscription"
                          : remainingQuestions > 0
                            ? `${remainingQuestions} questions remaining this hour`
                            : `Questions reset in ${formatTimeRemaining()}`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearConversation}
                            className="h-8 w-8 p-0 rounded-full hover:bg-muted transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="text-xs">Clear conversation</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleChat}
                    className="h-8 w-8 p-0 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-[400px] px-4" ref={scrollAreaRef}>
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                        className="bg-gradient-to-br from-primary/10 to-primary/20 p-3 rounded-full relative"
                      >
                        <Sparkles className="h-6 w-6 text-primary" />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                          className="absolute inset-0 bg-primary/20 rounded-full"
                        />
                      </motion.div>
                      <div>
                        <motion.h3
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                          className="font-medium text-base"
                        >
                          Welcome! How can I assist you today?
                        </motion.h3>
                        <AnimatedQuestions />
                      </div>
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="grid grid-cols-2 gap-2 w-full mt-2"
                      >
                        {suggestions.map((suggestion, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs justify-start h-auto py-2 text-left w-full transition-all hover:border-primary/50 hover:bg-primary/5"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4 pt-4 pb-4">
                      {messages.map((message, index) => (
                        <MessageBubble 
                          key={message.id} 
                          message={message} 
                          index={index}
                          onCopy={copyToClipboard}
                          copiedMessageId={copiedMessageId}
                        />
                      ))}
                      {isLoading && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ duration: 0.3 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-start gap-2">
                            <Avatar className="w-7 h-7">
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <Crown className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                            <div className="px-3 py-2 rounded-lg bg-muted">
                              <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                  <motion.div
                                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2, ease: "easeInOut" }}
                                    className="w-2 h-2 bg-primary rounded-full"
                                  ></motion.div>
                                  <motion.div
                                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                                    transition={{
                                      repeat: Number.POSITIVE_INFINITY,
                                      duration: 1.2,
                                      ease: "easeInOut",
                                      delay: 0.15,
                                    }}
                                    className="w-2 h-2 bg-primary rounded-full"
                                  ></motion.div>
                                  <motion.div
                                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                                    transition={{
                                      repeat: Number.POSITIVE_INFINITY,
                                      duration: 1.2,
                                      ease: "easeInOut",
                                      delay: 0.3,
                                    }}
                                    className="w-2 h-2 bg-primary rounded-full"
                                  ></motion.div>
                                </div>
                                <span className="text-xs text-muted-foreground">Thinking...</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {error && lastUserMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert variant="destructive" className="mx-0 mt-2 p-2">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <AlertDescription className="text-xs flex items-center justify-between">
                              <span>{error}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={retryLastMessage}
                                className="h-6 px-2 text-xs"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Retry
                              </Button>
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                      {!canUseChat() && messages.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert variant="destructive" className="mx-0 mt-2 p-2">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <AlertDescription className="text-xs">
                              {!subscription?.isSubscribed
                                ? "You've reached the free limit. Upgrade to Pro for unlimited questions."
                                : `Questions reset in ${formatTimeRemaining()}`}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              <CardFooter className="border-t p-3">
                <form onSubmit={handleChatSubmit} className="flex w-full items-center space-x-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={canUseChat() ? "Ask a question..." : "Chatbot unavailable"}
                    disabled={isLoading || !canUseChat()}
                    className="flex-grow text-sm h-9 rounded-full transition-all focus-visible:ring-primary/30 focus-visible:border-primary/50"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim() || !canUseChat()}
                    size="icon"
                    className="shrink-0 h-9 w-9 rounded-full transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Send className="h-4 w-4" />
                      </motion.div>
                    )}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          <TooltipProvider>
            <Tooltip open={showTooltip}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 400, damping: 25 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={toggleChat}
                    size="icon"
                    className="rounded-full h-12 w-12 shadow-lg bg-primary hover:bg-primary/90 transition-colors"
                  >
                    <MessageSquare className="h-5 w-5 text-primary-foreground" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="left" className="p-2">
                <p className="text-sm">Need help? Chat with our AI assistant!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </AnimatePresence>
    </div>
  )
}

// Provide a default export to support default-importing call sites
export default Chatbot
