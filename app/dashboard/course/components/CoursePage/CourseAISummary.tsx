import React, { useState, useEffect, useMemo, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import ComponentLoader from "../ComponentLoader"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import AIEmoji from "../AIEmoji"

interface CourseAISummaryProps {
  chapterId: number
  name: string
  onSummaryReady: (isReady: boolean) => void
}

interface SummaryResponse {
  success: boolean
  data?: string
  message?: string
}

const MAX_RETRIES = 3
const RETRY_INTERVAL = 60000 // 1 minute
const INITIAL_DELAY = 60000 // 1 minute

const fetchChapterSummary = async (chapterId: number): Promise<SummaryResponse> => {
  const response = await axios.post<SummaryResponse>(`/api/summary`, { chapterId })
  return response.data
}

const CourseAISummary: React.FC<CourseAISummaryProps> = ({ chapterId, name, onSummaryReady }) => {
  const [data, setData] = useState<SummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [showAIEmoji, setShowAIEmoji] = useState(true)

  const fetchSummary = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchChapterSummary(chapterId)
      onSummaryReady(response.success && !!response.data)
      setData(response)
      setShowAIEmoji(false)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      if (retryCount < MAX_RETRIES) {
        setRetryCountdown(RETRY_INTERVAL / 1000)
        const countdownInterval = setInterval(() => {
          setRetryCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              setRetryCount((prevRetry) => prevRetry + 1)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setShowAIEmoji(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [chapterId, onSummaryReady, retryCount])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSummary()
    }, INITIAL_DELAY)

    return () => clearTimeout(timer)
  }, [fetchSummary])

  const enhancedMarkdownRenderer = useCallback(({ children }: { children: React.ReactNode }) => {
    const processedContent = React.Children.map(children, (child) => {
      if (typeof child === "string") {
        let modifiedText = child.replace(/(Summary:)/g, "<br /><br />$1")
        modifiedText = modifiedText.replace(
          /\*\*(.*?)\*\*/g,
          '<span class="bg-primary/10 text-primary font-semibold px-1 rounded">$1</span>',
        )
        modifiedText = modifiedText.replace(
          /\[([^\]]+)\]/g,
          (match, term) =>
            `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(term.replace(/ /g, "_"))}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${term}</a>`,
        )
        return <span dangerouslySetInnerHTML={{ __html: modifiedText }} />
      }
      return child
    })
    return <>{processedContent}</>
  }, [])

  const content = useMemo(() => {
    if (showAIEmoji) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <AIEmoji />
          <p className="text-lg font-semibold text-primary">Preparing your AI summary...</p>
          <p className="text-sm text-muted-foreground">This may take a minute</p>
        </motion.div>
      )
    }

    if (isLoading || (!data?.success && retryCount < MAX_RETRIES)) {
      return <ComponentLoader size="sm" />
    }

    if (error || (retryCount >= MAX_RETRIES && (!data?.success || !data?.data))) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle size={20} />
            <p className="font-semibold">Error retrieving content</p>
          </div>
          <p className="text-muted-foreground">
            We're having trouble retrieving the content. Please check your connection and try again.
          </p>
          {retryCountdown > 0 ? (
            <p className="text-sm text-muted-foreground">Retrying in {retryCountdown} seconds...</p>
          ) : (
            <Button onClick={fetchSummary}>Retry Now</Button>
          )}
        </motion.div>
      )
    }

    if (data?.success && data.data) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold mb-6">{name}</h2>
          <Card>
            <CardContent className="p-6">
              <ReactMarkdown
                className="prose lg:prose-xl dark:prose-invert max-w-none"
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  p: ({ children }) => <div className="mb-4 leading-relaxed text-base">{children}</div>,
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mb-3 mt-6 text-primary border-b border-primary pb-2">
                      {children}
                    </h3>
                  ),
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>,
                  li: ({ children }) => <li className="text-base">{children}</li>,
                  strong: ({ children }) => {
                    if (typeof children === "string" && children.toLowerCase() === "main points:") {
                      return <h4 className="text-lg font-semibold mb-2 text-secondary">Main Points:</h4>
                    }

                    return (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <strong className="font-bold text-primary cursor-help block mb-2">{children}</strong>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Important concept</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  },
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {data.data}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <p className="text-muted-foreground">No content available at the moment. Please try again later.</p>
        <Button onClick={fetchSummary}>Retry</Button>
      </motion.div>
    )
  }, [isLoading, error, data, retryCount, name, fetchSummary, showAIEmoji]) // Removed unnecessary dependency: enhancedMarkdownRenderer

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={
            showAIEmoji ? "ai-emoji" : isLoading || (!data?.success && retryCount < MAX_RETRIES) ? "loading" : "content"
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default CourseAISummary

