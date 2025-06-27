"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, X, Send, Loader2, BrainCircuit, Crown, AlertCircle, HelpCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/tailwindUtils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import useSubscription from "@/hooks/use-subscription"



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

// Replace the existing AnimatedQuestions component with this improved version
const AnimatedQuestions = () => {
  const questions = [
    "How do I enroll in a course?",
    "What are the prerequisites for Machine Learning?",
    "Can you explain the concept of data normalization?",
    "How do I submit my assignments?",
    "What's the difference between supervised and unsupervised learning?",
    "How can I improve my coding skills?",
  ]

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % questions.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

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
}

interface ChatbotProps {
  userId: string
}

export default function Chatbot({ userId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { data, isLoading: isSubscriptionLoading } = useSubscription()
  const [remainingQuestions, setRemainingQuestions] = useState(5)
  const [lastQuestionTime, setLastQuestionTime] = useState(Date.now())
  const [showTooltip, setShowTooltip] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: { userId },
    onResponse: () => {
      setRemainingQuestions((prev) => Math.max(0, prev - 1))
      setLastQuestionTime(Date.now())
    },
  })

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [isOpen])

  // Reset remaining questions every hour
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastQuestionTime >= 3600000) {
        setRemainingQuestions(5)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [lastQuestionTime])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }, 100)
      }
    }
  }, [messages])

  // Show tooltip for new users
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem("hasSeenChatTooltip")
    if (!hasSeenTooltip) {
      setShowTooltip(true)
      setTimeout(() => {
        setShowTooltip(false)
        localStorage.setItem("hasSeenChatTooltip", "true")
      }, 5000)
    }
  }, [])

  const canUseChat = useCallback(() => {
    if (isSubscriptionLoading) return false
    if (!data?.isSubscribed) return remainingQuestions > 0 // Allow free users some questions
    return true // Subscribers have unlimited questions
  }, [isSubscriptionLoading, data?.status, remainingQuestions])

  const handleChatSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (canUseChat() && input.trim()) {
        handleSubmit(e)
      }
    },
    [canUseChat, handleSubmit, input],
  )

  const toggleChat = () => setIsOpen(!isOpen)

  // Quick reply suggestions
  const suggestions = [
    "How do I enroll in a course?",
    "What are the prerequisites for Machine Learning?",
    "Where can I find my quiz results?",
    "How do I get a certificate?",
  ]

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleInputChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLInputElement>)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

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
                  <CardTitle className="text-base font-medium">Course AI Assistant</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={remainingQuestions > 0 ? "outline" : "destructive"}
                          className="ml-2 text-xs font-normal cursor-help"
                        >
                          {data?.isSubscribed ? "Pro" : `${remainingQuestions} left`}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {data?.isSubscribed
                          ? "Unlimited questions with your Pro subscription"
                          : remainingQuestions > 0
                            ? `${remainingQuestions} questions remaining this hour`
                            : `Questions reset in ${formatTimeRemaining()}`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleChat}
                  className="h-8 w-8 p-0 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
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
                        className="bg-primary/10 p-3 rounded-full"
                      >
                        <HelpCircle className="h-6 w-6 text-primary" />
                      </motion.div>
                      <div>
                        <motion.h3
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                          className="font-medium text-base"
                        >
                          How can I help you?
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
                      {messages.map((m, index) => (
                        <motion.div
                          key={m.id}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          variants={messageVariants}
                          className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "flex gap-2 max-w-[85%]",
                              m.role === "user" ? "flex-row-reverse" : "flex-row",
                              m.role === "user" ? "items-end" : "items-start",
                            )}
                          >
                            <Avatar className="w-7 h-7 shrink-0">
                              {m.role === "user" ? (
                                <AvatarImage src="/user-avatar.png" alt="User" />
                              ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                  <Crown className="h-3.5 w-3.5 text-primary" />
                                </div>
                              )}
                              <AvatarFallback>{m.role === "user" ? "U" : "AI"}</AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm",
                                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                              )}
                            >
                              <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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
                                    animate={{ scale: [0.8, 1.2, 0.8] }}
                                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
                                    className="w-2 h-2 bg-primary/60 rounded-full"
                                  ></motion.div>
                                  <motion.div
                                    animate={{ scale: [0.8, 1.2, 0.8] }}
                                    transition={{
                                      repeat: Number.POSITIVE_INFINITY,
                                      duration: 1.5,
                                      ease: "easeInOut",
                                      delay: 0.2,
                                    }}
                                    className="w-2 h-2 bg-primary/60 rounded-full"
                                  ></motion.div>
                                  <motion.div
                                    animate={{ scale: [0.8, 1.2, 0.8] }}
                                    transition={{
                                      repeat: Number.POSITIVE_INFINITY,
                                      duration: 1.5,
                                      ease: "easeInOut",
                                      delay: 0.4,
                                    }}
                                    className="w-2 h-2 bg-primary/60 rounded-full"
                                  ></motion.div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert variant="destructive" className="mx-0 mt-2 p-2">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <AlertDescription className="text-xs">{error.message}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                      {!canUseChat() && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert variant="destructive" className="mx-0 mt-2 p-2">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <AlertDescription className="text-xs">
                              {!data?.isSubscribed
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
                    onChange={handleInputChange}
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
