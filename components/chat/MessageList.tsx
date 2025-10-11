"use client"

import React, { memo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Copy, Check, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ChatAction {
  type: string
  label: string
  url: string
  disabled?: boolean
  disabledReason?: string
  metadata?: any
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  actions?: ChatAction[]
}

interface MessageBubbleProps {
  message: ChatMessage
  index: number
  onCopy: (text: string, id: string) => void
  copiedMessageId: string | null
}

// Memoized message bubble component with copy functionality
const MessageBubble = memo(({ message, index, onCopy, copiedMessageId }: MessageBubbleProps) => {
  const isCopied = copiedMessageId === message.id

  const handleCopy = useCallback(() => {
    onCopy(message.content, message.id)
  }, [message.content, message.id, onCopy])

  return (
    <motion.div
      key={message.id}
      custom={index}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={messageVariants}
      className={cn("flex group", message.role === "user" ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "flex gap-2 max-w-[85%] sm:max-w-[80%]",
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
              message.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm",
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
              onClick={handleCopy}
              className={cn(
                "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity self-start ml-1",
                "hover:bg-muted/80"
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
          
          {/* Render action buttons */}
          {message.role === "assistant" && message.actions && message.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 ml-1">
              {message.actions.map((action, idx) => (
                <Button
                  key={idx}
                  variant={action.type === 'upgrade_plan' ? 'default' : 'outline'}
                  size="sm"
                  disabled={action.disabled}
                  onClick={() => {
                    if (!action.disabled) {
                      window.location.href = action.url
                    }
                  }}
                  className={cn(
                    "h-8 text-xs",
                    action.disabled && "opacity-60 cursor-not-allowed"
                  )}
                  title={action.disabledReason}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
})

MessageBubble.displayName = 'MessageBubble'

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
    else if (linkText.includes('Flashcard') || linkText.includes('Study')) Icon = Brain

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
    } else if (headingText.includes('Create') || headingText.includes('Build')) {
      Icon = Plus
      bgColor = 'bg-emerald-50 dark:bg-emerald-900/20'
      textColor = 'text-emerald-700 dark:text-emerald-300'
      borderColor = 'border-emerald-200 dark:border-emerald-700'
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
    } else if (text.includes('Flashcard') || text.includes('Study')) {
      bullet = '🧠'
      bulletColor = 'text-teal-500'
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

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  lastUserMessage: string
  onRetry: () => void
  onCopy: (text: string, id: string) => void
  copiedMessageId: string | null
}

// Animation variants for messages
const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

// Import icons that are used in markdown components
import { Crown, ExternalLink, Target, BookOpen, Plus, Code2, Search, Brain, ChevronRight, Sparkles } from "lucide-react"

export const MessageList = memo(({
  messages,
  isLoading,
  error,
  lastUserMessage,
  onRetry,
  onCopy,
  copiedMessageId
}: MessageListProps) => {
  return (
    <div className="space-y-4 pt-4 pb-4">
      <AnimatePresence>
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            index={index}
            onCopy={onCopy}
            copiedMessageId={copiedMessageId}
          />
        ))}
      </AnimatePresence>

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
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
            <div className="px-3 py-2 rounded-lg bg-muted rounded-bl-sm">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2, ease: "easeInOut" }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.2,
                      ease: "easeInOut",
                      delay: 0.15,
                    }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.2,
                      ease: "easeInOut",
                      delay: 0.3,
                    }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                </div>
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
})

MessageList.displayName = 'MessageList'