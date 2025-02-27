"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, X, Send, Loader2, Sparkles, BrainCircuit, Crown, AlertCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import debounce from "lodash/debounce"

interface ChatbotProps {
  userId: string
}

const exampleQuestions = [
  "What courses do you recommend for learning React?",
  "Can you suggest a quiz to test my JavaScript skills?",
  "How can I improve my web development skills?",
  "What's the best way to learn about AI and machine learning?",
  "Are there any courses on mobile app development?",
]

export function Chatbot({ userId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayedContent, setDisplayedContent] = useState("")
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: { userId },
    onResponse: (response) => {
      cleanupAnimations()
      setDisplayedContent("")
    },
    onFinish: (message) => {
      cleanupAnimations()
      animateText(message.content)
    },
  })

  const handleScroll = useCallback(
    debounce(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        })
      }
    }, 100),
    [],
  )

  const cleanupAnimations = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const animateText = useCallback(
    (content: string) => {
      cleanupAnimations()
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      setDisplayedContent("")
      const chunkSize = 3
      let currentIndex = 0

      const animate = () => {
        if (signal.aborted) return

        if (currentIndex < content.length) {
          const chunk = content.slice(currentIndex, currentIndex + chunkSize)
          setDisplayedContent((prev) => prev + chunk)
          currentIndex += chunkSize
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    },
    [cleanupAnimations],
  )

  useEffect(() => {
    handleScroll()
  }, [handleScroll])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex((prevIndex) => (prevIndex + 1) % exampleQuestions.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    return cleanupAnimations
  }, [cleanupAnimations])

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
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                        <Sparkles className="h-8 w-8" />
                        <p className="text-sm text-center px-4">
                          Ask me anything about our courses, quizzes, or get personalized learning recommendations!
                        </p>
                      </div>
                    )}
                    {messages.map((m, index) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                      >
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
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {m.role === "user" ? (
                                <p className="text-sm">{m.content}</p>
                              ) : (
                                <ReactMarkdown
                                  components={{
                                    a: ({ node, ...props }) => (
                                      <a
                                        {...props}
                                        className="text-primary hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      />
                                    ),
                                    p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                                    ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 mb-2" />,
                                    ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-4 mb-2" />,
                                    li: ({ node, ...props }) => <li {...props} className="mb-1" />,
                                    code: ({ node, inline, ...props }) =>
                                      inline ? (
                                        <code {...props} className="bg-primary/10 text-primary px-1 py-0.5 rounded" />
                                      ) : (
                                        <code
                                          {...props}
                                          className="block bg-primary/10 p-2 rounded my-2 overflow-x-auto"
                                        />
                                      ),
                                  }}
                                >
                                  {index === messages.length - 1 && m.role === "assistant"
                                    ? displayedContent
                                    : m.content}
                                </ReactMarkdown>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
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
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder={exampleQuestions[currentExampleIndex]}
                    disabled={isLoading || !userId}
                    className="flex-grow"
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="shrink-0">
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

