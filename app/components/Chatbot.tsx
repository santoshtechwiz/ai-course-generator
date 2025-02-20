"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, X, Send, Loader2 } from "lucide-react"

import ReactMarkdown from "react-markdown"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { motion, AnimatePresence } from "framer-motion"
import { Course, UserQuiz } from "@prisma/client"

interface ChatbotProps {
  userId: string
}

export function Chatbot({ userId }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestedCourses, setSuggestedCourses] = useState<Course[]>([])
  const [suggestedQuizzes, setSuggestedQuizzes] = useState<UserQuiz[]>([])
  const [displayedContent, setDisplayedContent] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { subscriptionStatus } = useSubscriptionStore()
  const isAuthorized = subscriptionStatus?.subscriptionPlan !== "FREE"

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    body: { userId },
    onFinish: (message) => {
      try {
        const content = message.content
        const coursesMatch = content.match(/Courses:([\s\S]*?)(?=\n\nQuizzes:|$)/)
        const quizzesMatch = content.match(/Quizzes:([\s\S]*?)(?=\n\n|$)/)

        if (coursesMatch) {
          const courses = coursesMatch[1]
            .trim()
            .split("\n")
            .map((course) => {
              const match = course.match(/\*\*\[(.*?)\]$$(.*?)$$\*\*/)
              return match ? { id: match[2].split("/").pop(), name: match[1] } : null
            })
            .filter(Boolean)
          setSuggestedCourses(courses)
        }

        if (quizzesMatch) {
          const quizzes = quizzesMatch[1]
            .trim()
            .split("\n")
            .map((quiz) => {
              const match = quiz.match(/\*\*\[(.*?)\]$$(.*?)$$\*\*/)
              return match ? { id: match[2].split("/").pop(), topic: match[1] } : null
            })
            .filter(Boolean)
          setSuggestedQuizzes(quizzes)
        }
      } catch (error) {
        console.error("Error parsing message content:", error)
      }
    },
  })

  const toggleChat = () => setIsOpen(!isOpen)

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === "assistant") {
        setDisplayedContent("") // Reset displayed content
        let i = 0
        const typingInterval = setInterval(() => {
          if (i < lastMessage.content.length) {
            setDisplayedContent((prev) => prev + lastMessage.content[i])
            i++
          } else {
            clearInterval(typingInterval)
          }
        }, 20) // Adjust typing speed here
        return () => clearInterval(typingInterval)
      } else {
        setDisplayedContent("")
      }
    }
  }, [messages])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages, displayedContent])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="w-96 h-[500px] flex flex-col shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">AI Learning Assistant</CardTitle>
                <Button variant="ghost" size="sm" onClick={toggleChat}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full px-4 custom-scrollbar" ref={scrollAreaRef}>
                  <div className="space-y-4 pt-4 pb-4">
                    {messages.map((m, index) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex items-end space-x-2 ${
                            m.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={m.role === "user" ? "/user-avatar.png" : "/ai-avatar.png"} />
                            <AvatarFallback>{m.role === "user" ? "U" : "AI"}</AvatarFallback>
                          </Avatar>
                          <div
                            className={`px-3 py-2 rounded-lg max-w-[80%] ${
                              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            {m.role === "user" ? (
                              m.content
                            ) : (
                              <ReactMarkdown
                                components={{
                                  a: ({ node, ...props }) => (
                                    <a
                                      {...props}
                                      className="text-blue-500 hover:underline"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    />
                                  ),
                                  strong: ({ node, ...props }) => (
                                    <strong {...props} className="text-emerald-600 font-semibold" />
                                  ),
                                  p: ({ node, ...props }) => <p {...props} className="text-sm" />,
                                  ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5" />,
                                  ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5" />,
                                  li: ({ node, ...props }) => <li {...props} className="text-sm" />,
                                  code: ({ node, ...props }) => (
                                    <code {...props} className="bg-gray-100 dark:bg-gray-800 p-1 rounded text-sm" />
                                  ),
                                  blockquote: ({ node, ...props }) => (
                                    <blockquote
                                      {...props}
                                      className="border-l-4 border-gray-300 dark:border-gray-600 pl-2 italic"
                                    />
                                  ),
                                }}
                              >
                                {index === messages.length - 1 && m.role === "assistant" ? displayedContent : m.content}
                              </ReactMarkdown>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-end space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="/ai-avatar.png" />
                            <AvatarFallback>AI</AvatarFallback>
                          </Avatar>
                          <div className="px-3 py-2 rounded-lg bg-muted">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a question..."
                    disabled={isLoading || isAuthorized}
                    className="flex-grow"
                  />
                  <Button type="submit" disabled={isLoading} size="icon">
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
              className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <MessageSquare className="h-6 w-6 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}