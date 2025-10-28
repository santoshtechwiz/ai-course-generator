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
import { MessageSquare, X, BrainCircuit, AlertCircle, RotateCcw, Trash2, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useChatStore } from "@/hooks/useChatStore"
import { storageManager } from "@/utils/storage-manager"
import { MessageList } from "@/components/chat/MessageList"
import { ChatInput } from "@/components/chat/ChatInput"
import { WelcomeScreen } from "@/components/chat/WelcomeScreen"
import "@/app/styles/chatbot.css"

// Enhanced animation variants with brutal theme
const chatContainerVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
}

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

interface ChatbotProps {
  userId: string
}

function Chatbot({ userId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
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

  // Enhanced auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!scrollAreaRef.current) return

    const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
    if (!scrollContainer) return

    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest' 
        })
      } else {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        })
      }
    }

    requestAnimationFrame(() => {
      setTimeout(scrollToBottom, 100)
    })
  }, [messages.length, isLoading])

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
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-open"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={chatContainerVariants}
            className="relative"
          >
            <Card className="w-[90vw] max-w-[400px] h-[80vh] max-h-[600px] flex flex-col border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] rounded-none overflow-hidden bg-white dark:bg-gray-900">
              {/* Enhanced Header */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b-4 border-black dark:border-white px-4 sm:px-5 py-4 bg-gradient-to-r from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <motion.div
                    animate={pulseAnimation}
                    className="flex-shrink-0"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-gray-900 border-4 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center">
                      <BrainCircuit className="h-5 w-5 text-black dark:text-white" />
                    </div>
                  </motion.div>
                  <div className="flex flex-col min-w-0">
                    <CardTitle className="text-base sm:text-lg font-black uppercase tracking-tight text-black dark:text-white truncate">
                      AI Assistant
                    </CardTitle>
                    {messages.length > 0 && (
                      <span className="text-xs font-bold text-black/70 dark:text-white/70">
                        {messages.length} messages
                      </span>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            "ml-auto font-black text-xs uppercase tracking-wider border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] cursor-help flex-shrink-0",
                            subscription?.isSubscribed 
                              ? "bg-yellow-400 dark:bg-yellow-500 text-black" 
                              : remainingQuestions > 0 
                                ? "bg-green-400 dark:bg-green-600 text-black dark:text-white" 
                                : "bg-red-400 dark:bg-red-600 text-black dark:text-white"
                          )}
                        >
                          {subscription?.isSubscribed ? (
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              <span className="hidden sm:inline">PRO</span>
                            </div>
                          ) : (
                            `${remainingQuestions}`
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="left" 
                        className="bg-black dark:bg-white text-white dark:text-black border-2 border-white dark:border-black font-bold text-xs"
                      >
                        {subscription?.isSubscribed
                          ? "Unlimited questions with Pro"
                          : remainingQuestions > 0
                            ? `${remainingQuestions} questions left`
                            : `Resets in ${formatTimeRemaining()}`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                  {messages.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearConversation}
                            className="h-9 w-9 bg-white dark:bg-gray-900 hover:bg-red-400 dark:hover:bg-red-600 text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all rounded-none"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="left"
                          className="bg-black dark:bg-white text-white dark:text-black border-2 border-white dark:border-black font-bold text-xs"
                        >
                          Clear chat
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleChat}
                    className="h-9 w-9 bg-white dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all rounded-none"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Content Area */}
              <CardContent className="flex-grow overflow-hidden p-0 bg-gray-50 dark:bg-gray-950">
                <ScrollArea className="h-full px-3 sm:px-4 py-3" ref={scrollAreaRef}>
                  {messages.length === 0 ? (
                    <WelcomeScreen
                      onSuggestionClick={handleSuggestionClick}
                      canUseChat={canUseChat()}
                    />
                  ) : (
                    <>
                      <MessageList
                        messages={messages}
                        isLoading={isLoading}
                        error={error}
                        lastUserMessage={lastUserMessage}
                        onRetry={retryLastMessage}
                        onCopy={copyToClipboard}
                        copiedMessageId={copiedMessageId}
                      />
                      <div ref={messagesEndRef} className="h-2" aria-hidden="true" />
                    </>
                  )}

                  {/* Error Alert - Enhanced */}
                  {error && lastUserMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3"
                    >
                      <Alert 
                        variant="destructive" 
                        className="border-4 border-black dark:border-white bg-red-100 dark:bg-red-900/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-none p-3"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <AlertDescription className="text-xs font-bold text-red-900 dark:text-red-200">
                              {error}
                            </AlertDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={retryLastMessage}
                            className="h-7 px-2 text-xs font-black uppercase bg-white dark:bg-gray-900 hover:bg-red-400 dark:hover:bg-red-600 text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] rounded-none flex-shrink-0"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      </Alert>
                    </motion.div>
                  )}

                  {/* Limit Reached Alert - Enhanced */}
                  {!canUseChat() && messages.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3"
                    >
                      <Alert 
                        className="border-4 border-black dark:border-white bg-yellow-100 dark:bg-yellow-900/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] rounded-none p-3"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-yellow-700 dark:text-yellow-400" />
                          <AlertDescription className="text-xs font-bold text-yellow-900 dark:text-yellow-200">
                            {!subscription?.isSubscribed
                              ? "Free limit reached. Upgrade to Pro for unlimited questions!"
                              : `Questions reset in ${formatTimeRemaining()}`}
                          </AlertDescription>
                        </div>
                      </Alert>
                    </motion.div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Enhanced Footer/Input Area */}
              <div className="border-t-4 border-black dark:border-white bg-white dark:bg-gray-900">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSubmit={handleChatSubmit}
                  isLoading={isLoading}
                  canUseChat={canUseChat()}
                  messages={messages}
                  onSuggestionClick={handleSuggestionClick}
                />
              </div>
            </Card>
          </motion.div>
        ) : (
          <TooltipProvider>
            <Tooltip open={showTooltip}>
              <TooltipTrigger asChild>
                <motion.div
                  key="chat-closed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, -5, 5, -5, 0],
                    transition: { rotate: { duration: 0.5 } }
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ 
                    duration: 0.3, 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25 
                  }}
                >
                  <Button
                    onClick={toggleChat}
                    size="icon"
                    className="relative rounded-full h-14 w-14 sm:h-16 sm:w-16 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] bg-gradient-to-br from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600 hover:from-blue-500 hover:to-purple-500 dark:hover:from-blue-700 dark:hover:to-purple-700 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all"
                  >
                    <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    {/* Notification badge for unread messages */}
                    {messages.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-black flex items-center justify-center border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                      >
                        {messages.length > 9 ? "9+" : messages.length}
                      </motion.div>
                    )}
                    {/* Pulse effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-blue-400 dark:border-blue-600"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent 
                side="left" 
                className="bg-black dark:bg-white text-white dark:text-black border-4 border-white dark:border-black p-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-sm uppercase tracking-wide">Need Help? Ask AI!</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Chatbot