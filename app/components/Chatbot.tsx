"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, X, Send, Loader2, Sparkles, BrainCircuit, Crown, AlertCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { Course, UserQuiz } from "@prisma/client"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ChatbotProps {
  userId?: string
}

export function Chatbot({ userId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)

  const [displayedContent, setDisplayedContent] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: { userId },
  })

  const toggleChat = () => setIsOpen(!isOpen)

  // Typing animation effect
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === "assistant") {
        setDisplayedContent("")
        let i = 0
        const content = lastMessage.content
        const chunkSize = 2 // Process 2 characters at a time for smoother animation
        const typingInterval = setInterval(() => {
          if (i < content.length) {
            const chunk = content.slice(i, i + chunkSize)
            setDisplayedContent((prev) => prev + chunk)
            i += chunkSize
          } else {
            clearInterval(typingInterval)
          }
        }, 10) // Faster interval but processing more characters
        return () => clearInterval(typingInterval)
      }
    }
  }, [messages])

  // Auto-scroll effect
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <Card className="w-[min(96vw,360px)] h-[480px] flex flex-col shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 border-b px-4 py-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">Course AI</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleChat} className="hover:bg-muted">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full px-3" ref={scrollAreaRef}>
                  <div className="space-y-3 pt-3 pb-3">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-24 gap-2 text-muted-foreground">
                        <Sparkles className="h-8 w-8" />
                        <p className="text-sm text-center">
                          Ask me anything about your courses or get personalized learning recommendations!
                        </p>
                      </div>
                    )}
                    {messages.map((m, index) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "flex items-end space-x-2",
                            m.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row",
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
                              "px-3 py-2 rounded-lg max-w-[80%] min-h-[2.5rem]",
                              m.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted border border-border/50",
                            )}
                          >
                            <div className="w-full break-words">
                              {m.role === "user" ? (
                                <span className="text-sm">{m.content}</span>
                              ) : (
                                <ReactMarkdown
                                  className="w-full"
                                  components={{
                                    a: ({ node, ...props }) => (
                                      <a
                                        {...props}
                                        className="text-primary hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      />
                                    ),
                                    strong: ({ node, ...props }) => (
                                      <strong {...props} className="text-primary font-semibold" />
                                    ),
                                    p: ({ node, ...props }) => (
                                      <p {...props} className="text-sm leading-relaxed my-0.5 w-full" />
                                    ),
                                    ul: ({ node, ...props }) => (
                                      <ul {...props} className="list-disc pl-4 space-y-0.5 my-1 w-full" />
                                    ),
                                    ol: ({ node, ...props }) => (
                                      <ol {...props} className="list-decimal pl-4 space-y-0.5 my-1 w-full" />
                                    ),
                                    li: ({ node, ...props }) => <li {...props} className="text-sm" />,
                                    code: ({ node, ...props }) => (
                                      <code
                                        {...props}
                                        className="bg-primary/10 text-primary px-1 py-0.5 rounded text-sm"
                                      />
                                    ),
                                    blockquote: ({ node, ...props }) => (
                                      <blockquote
                                        {...props}
                                        className="border-l-4 border-primary/20 pl-3 italic my-1"
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
                          <div className="px-3 py-2 rounded-lg bg-muted border border-border/50 min-h-[2.5rem]">
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
              <CardFooter className="border-t p-3">
                <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about your courses..."
                    disabled={isLoading || userId === ""}
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

