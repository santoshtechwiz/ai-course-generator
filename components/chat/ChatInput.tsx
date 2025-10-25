"use client"

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, Sparkles, BookOpen, Target, Plus, Search, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  canUseChat: boolean
  messages: Array<{ role: string; content: string }>
  onSuggestionClick: (suggestion: string) => void
}

const ChatInput = memo(({
  input,
  setInput,
  onSubmit,
  isLoading,
  canUseChat,
  messages,
  onSuggestionClick
}: ChatInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when component mounts or when chat becomes available
  useEffect(() => {
    if (canUseChat && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [canUseChat])

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canUseChat || !input.trim() || isLoading) return
    onSubmit(e)
  }, [canUseChat, input, isLoading, onSubmit])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion)
    onSuggestionClick(suggestion)
  }, [setInput, onSuggestionClick])

  // Dynamic contextual suggestions based on conversation
  const suggestions = useMemo(() => {
    const lastMessage = messages[messages.length - 1]
    const hasCourseMention = lastMessage?.content?.toLowerCase().includes('course')
    const hasQuizMention = lastMessage?.content?.toLowerCase().includes('quiz')

    if (messages.length === 0) {
      return [
        { text: "Show me Python courses", icon: BookOpen, color: "text-green-600" },
        { text: "What can I learn here?", icon: Sparkles, color: "text-blue-600" },
        { text: "Help me find JavaScript tutorials", icon: Search, color: "text-purple-600" },
        { text: "Show available quizzes", icon: Target, color: "text-orange-600" },
      ]
    }

    if (hasCourseMention) {
      return [
        { text: "How do I enroll?", icon: Plus, color: "text-emerald-600" },
        { text: "Show similar courses", icon: Search, color: "text-blue-600" },
        { text: "What's the difficulty level?", icon: Brain, color: "text-purple-600" },
        { text: "Create a custom course", icon: Plus, color: "text-orange-600" },
      ]
    }

    if (hasQuizMention) {
      return [
        { text: "Take this quiz", icon: Target, color: "text-orange-600" },
        { text: "Create a new quiz", icon: Plus, color: "text-emerald-600" },
        { text: "Show my quiz results", icon: Brain, color: "text-purple-600" },
        { text: "More quiz topics", icon: Search, color: "text-blue-600" },
      ]
    }

    return [
      { text: "Find courses for me", icon: BookOpen, color: "text-green-600" },
      { text: "Create a quiz", icon: Plus, color: "text-emerald-600" },
      { text: "How do I get started?", icon: Sparkles, color: "text-blue-600" },
      { text: "Show recommendations", icon: Search, color: "text-purple-600" },
    ]
  }, [messages])

  return (
    <div className="border-t-4 border-border p-3 bg-background">
      {/* Suggestions */}
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-2 gap-2 mb-3"
        >
          {suggestions.map((suggestion, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            >
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs justify-start h-auto py-2 text-left w-full transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  "border-border/50 bg-background/50"
                )}
                onClick={() => handleSuggestionClick(suggestion.text)}
                disabled={!canUseChat}
              >
                <suggestion.icon className={cn("mr-2 h-3 w-3 flex-shrink-0", suggestion.color)} />
                <span className="truncate">{suggestion.text}</span>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            canUseChat
              ? "Ask about courses, quizzes, or learning tips..."
              : "Chatbot unavailable - upgrade to Pro for unlimited questions"
          }
          disabled={isLoading || !canUseChat}
          className={cn(
            "flex-grow text-sm h-11 rounded-full transition-all",
            "focus-visible:ring-primary/30 focus-visible:border-primary/50",
            "border-4 border-border bg-background",
            !canUseChat && "opacity-60 cursor-not-allowed"
          )}
          aria-label="Chat message input"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim() || !canUseChat}
          size="icon"
          className={cn(
            "shrink-0 h-11 w-11 rounded-full transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            canUseChat && input.trim() && !isLoading && "hover:scale-105 active:scale-95"
          )}
          aria-label={isLoading ? "Sending message..." : "Send message"}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <motion.div
              whileHover={canUseChat && input.trim() ? { scale: 1.1 } : undefined}
              whileTap={canUseChat && input.trim() ? { scale: 0.9 } : undefined}
            >
              <Send className="h-4 w-4" />
            </motion.div>
          )}
        </Button>
      </form>
    </div>
  )
})

ChatInput.displayName = 'ChatInput'

export { ChatInput }