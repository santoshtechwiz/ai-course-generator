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
import { MessageSquare, X, Send, Loader2, BrainCircuit, Crown, AlertCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import useSubscriptionStore from "@/store/useSubscriptionStore"

interface ChatbotProps {
  userId: string
}

export function Chatbot({ userId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { subscriptionStatus, isLoading: isSubscriptionLoading } = useSubscriptionStore()
  const [remainingQuestions, setRemainingQuestions] = useState(5)
  const [lastQuestionTime, setLastQuestionTime] = useState(Date.now())

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: { userId },
    onResponse: () => {
      setRemainingQuestions((prev) => Math.max(0, prev - 1))
      setLastQuestionTime(Date.now())
    },
  })

  useEffect(() => {
    // Reset remaining questions every hour
    const interval = setInterval(() => {
      if (Date.now() - lastQuestionTime >= 3600000) {
        setRemainingQuestions(5)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [lastQuestionTime])

  const canUseChat = useCallback(() => {
    if (isSubscriptionLoading) return false
    if (!subscriptionStatus?.isSubscribed) return false
    return remainingQuestions > 0
  }, [isSubscriptionLoading, subscriptionStatus, remainingQuestions])

  const handleChatSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (canUseChat()) {
        handleSubmit(e)
      }
    },
    [canUseChat, handleSubmit],
  )

  const toggleChat = () => setIsOpen(!isOpen)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <Card className="w-[min(96vw,400px)] h-[600px] flex flex-col shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b px-4 py-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">Course AI Assistant</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleChat} className="hover:bg-muted">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full px-4" ref={scrollAreaRef}>
                  <div className="space-y-4 pt-4 pb-4">
                    {messages.map((m, index) => (
                      <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "flex items-end gap-2 max-w-[80%]",
                            m.role === "user" ? "flex-row-reverse" : "flex-row",
                          )}
                        >
                          <Avatar className="w-8 h-8">
                            {m.role === "user" ? (
                              <AvatarImage src="/user-avatar.png" />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <Crown className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <AvatarFallback>{m.role === "user" ? "U" : "AI"}</AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "px-4 py-2 rounded-lg",
                              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                            )}
                          >
                            <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-end space-x-2">
                          <Avatar className="w-8 h-8">
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              <Crown className="h-4 w-4 text-primary" />
                            </div>
                            <AvatarFallback>AI</AvatarFallback>
                          </Avatar>
                          <div className="px-4 py-2 rounded-lg bg-muted">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {error && (
                      <Alert variant="destructive" className="mx-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error.message}</AlertDescription>
                      </Alert>
                    )}
                    {!canUseChat() && (
                      <Alert variant="destructive" className="mx-4 mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {!subscriptionStatus?.isSubscribed
                            ? "You need to subscribe to use the chatbot. Please upgrade your plan."
                            : "You've reached the maximum number of questions for this hour. Please try again later."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t p-4">
                <form onSubmit={handleChatSubmit} className="flex w-full items-center space-x-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder={canUseChat() ? "Ask a question..." : "Chatbot unavailable"}
                    disabled={isLoading || !canUseChat()}
                    className="flex-grow"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim() || !canUseChat()}
                    size="icon"
                    className="shrink-0"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={toggleChat}
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90"
            >
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

