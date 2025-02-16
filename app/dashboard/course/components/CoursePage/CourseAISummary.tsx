"use client"

import type React from "react"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import AIEmoji from "../AIEmoji"
import PDFGenerator from "@/app/components/shared/PDFGenerator"
import { useChapterSummary } from "@/hooks/useChapterSummary"
import { processMarkdown } from "@/lib/markdownProcessor"
import PageLoader from "@/components/ui/loader"

interface CourseAISummaryProps {
  chapterId: number
  name: string
  existingSummary: string | null
  isPremium: boolean
}

const CourseAISummary: React.FC<CourseAISummaryProps> = ({ chapterId, name, existingSummary, isPremium }) => {
  const [showAIEmoji, setShowAIEmoji] = useState(false)
  const { data, isLoading, isError, error, refetch } = useChapterSummary(chapterId, Boolean(existingSummary))

  useEffect(() => {
    if (!existingSummary && !isPremium) {
      setShowAIEmoji(true)
    }
  }, [existingSummary, isPremium])

  const processedContent = existingSummary || (data?.success && data.data ? processMarkdown(data.data) : "")

  const content = () => {
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

    if (isLoading && !existingSummary) {
      return <PageLoader />
    }

    if (isError && !existingSummary) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle size={20} />
            <p className="font-semibold">Error retrieving content</p>
          </div>
          <p className="text-muted-foreground">
            We're having trouble retrieving the content. Please check your connection and try again.
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry Now
          </Button>
        </motion.div>
      )
    }

    if (processedContent) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold mb-6">{name}</h2>
          <Card className="bg-card">
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
                            <strong className="font-bold text-primary cursor-help">{children}</strong>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Important concept</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  },
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </CardContent>
          </Card>
          <PDFGenerator markdown={processedContent} chapterName={name} />
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
        <Button variant="secondary" onClick={() => refetch()}>
          Retry
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="relative space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={showAIEmoji ? "ai-emoji" : isLoading ? "loading" : "content"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {content()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default CourseAISummary

