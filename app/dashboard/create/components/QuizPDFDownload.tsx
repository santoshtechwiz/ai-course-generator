"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { pdf } from "@react-pdf/renderer"
import type { QuizPDFProps } from "./ConfigurableQuizPDF"
import { Button } from "@/components/ui/button"
import ConfigurableQuizPDF from "./ConfigurableQuizPDF"
import { Download, FileText, Lock } from "lucide-react"

import { cn } from "@/lib/tailwindUtils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import useSubscription from "@/hooks/use-subscription"

interface QuizPDFDownloadProps extends QuizPDFProps {
  config?: {
    showOptions?: boolean
    showAnswerSpace?: boolean
    answerSpaceHeight?: number
    showAnswers?: boolean
  }
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

const QuizPDFDownload: React.FC<QuizPDFDownloadProps> = ({
  quizData,
  config,
  className,
  variant = "outline",
  size = "lg",
}) => {
  const [isClient, setIsClient] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const { data:status, canDownloadPDF, isLoading } = useSubscription()
  const shadowPulse = "shadow-md hover:shadow-lg transition-shadow duration-200"

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isDataReady = useMemo(() => quizData && Object.keys(quizData).length > 0, [quizData])

  const quizSlug = useMemo(
    () => (isDataReady ? `${quizData?.title || "quiz"}.pdf` : "quiz.pdf"),
    [isDataReady, quizData],
  )

  const isDisabled = useMemo(
    () => !isClient || !isDataReady || isLoading || !canDownloadPDF,
    [isClient, isDataReady, isLoading, canDownloadPDF],
  )

  const handleDownload = async () => {
    if (isDownloading || isDisabled) return

    setIsDownloading(true)
    let url = ""

    try {
      const blob = await pdf(<ConfigurableQuizPDF quizData={quizData} config={config} />).toBlob()
      url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = quizSlug
      link.click()
    } catch (error) {
      console.error("Error in download process:", error)
      alert("Failed to download the PDF. Please try again.")
    } finally {
      if (url) URL.revokeObjectURL(url)
      setIsDownloading(false)
    }
  }

  if (!isClient) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDownload}
            disabled={isDisabled}
            variant={variant}
            size={size}
            className={cn(
              "relative group h-12 w-12 rounded-xl",
              "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200",
              "dark:from-blue-900/30 dark:to-blue-800/40 dark:text-blue-300 dark:hover:from-blue-800/40 dark:hover:to-blue-700/50",
              shadowPulse,
              "focus:ring-2 focus:ring-blue-400 focus:ring-offset-1",
              !canDownloadPDF && "opacity-60 cursor-not-allowed",
              className,
            )}
            aria-label="Download PDF"
          >
            {isDownloading ? (
              <span className="flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              </span>
            ) : (
              <>
                {isDisabled ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <div className="relative flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 bg-blue-500 text-white rounded-full">
                      <Download className="h-2.5 w-2.5" />
                    </div>
                    <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-bold bg-blue-600 text-white px-1 rounded">
                      PDF
                    </span>
                  </div>
                )}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-blue-900 text-white border-blue-700">
          {isDisabled ? "Upgrade your subscription to download quizzes as PDF" : "Download this quiz as a PDF file"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default QuizPDFDownload
