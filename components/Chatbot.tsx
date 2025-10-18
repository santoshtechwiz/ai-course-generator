"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { MessageSquare, X, BrainCircuit, AlertCircle, RotateCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useChatStore } from "@/hooks/useChatStore"
import { storageManager } from "@/utils/storage-manager"
import { MessageList } from "@/components/chat/MessageList"
import { ChatInput } from "@/components/chat/ChatInput"
import { WelcomeScreen } from "@/components/chat/WelcomeScreen"

// Enhanced animation variants
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

interface ChatbotProps {
  userId: string
}

export function Chatbot({ userId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { subscription } = useUnifiedSubscription()
  const { toast } = useToast()

  // Use the chat store hook
  const {
    messages,
    isLoading,
    error,
    remainingQuestions,
    lastQuestionTime,
    lastUserMessage,
    sendMessage,
    clearConversation,
    retryLastMessage,
    setError
  } = useChatStore(userId)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!scrollAreaRef.current || messages.length === 0) return

    const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
    if (!scrollContainer) return

    requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    })
  }, [messages.length])

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

  // Memoized subscription check
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

  // Handle chat submission
  const handleChatSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!canUseChat() || !input.trim() || isLoading) return
      await sendMessage(input)
      setInput("")
    },
    [canUseChat, input, isLoading, sendMessage]
  )

  // Handle suggestion click
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

  const toggleChat = useCallback(() => setIsOpen(prev => !prev), [])

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
            <Card className="w-[350px] sm:w-[400px] h-[500px] flex flex-col border-3 border-border shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] rounded-lg overflow-hidden">
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
                            className="h-8 w-8 p-0 rounded-sm hover:bg-muted transition-none border-2 border-transparent hover:border-border"
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
                    className="h-8 w-8 p-0 rounded-sm hover:bg-muted transition-none border-2 border-transparent hover:border-border"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-[400px] px-4" ref={scrollAreaRef}>
                  {messages.length === 0 ? (
                    <WelcomeScreen
                      onSuggestionClick={handleSuggestionClick}
                      canUseChat={canUseChat()}
                    />
                  ) : (
                    <MessageList
                      messages={messages}
                      isLoading={isLoading}
                      error={error}
                      lastUserMessage={lastUserMessage}
                      onRetry={retryLastMessage}
                      onCopy={copyToClipboard}
                      copiedMessageId={copiedMessageId}
                    />
                  )}

                  {/* Error Alert */}
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

                  {/* Limit Reached Alert */}
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
                </ScrollArea>
              </CardContent>

              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleChatSubmit}
                isLoading={isLoading}
                canUseChat={canUseChat()}
                messages={messages}
                onSuggestionClick={handleSuggestionClick}
              />
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
                    className="rounded-full h-12 w-12 border-3 border-border shadow-[4px_4px_0px_0px_var(--border)] bg-main hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--border)] active:shadow-[2px_2px_0px_0px_var(--border)] transition-none"
                  >
                    <MessageSquare className="h-5 w-5 text-main-foreground" />
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
