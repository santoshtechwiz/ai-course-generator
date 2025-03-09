"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { pdf } from "@react-pdf/renderer"
import type { QuizPDFProps } from "./ConfigurableQuizPDF"
import { Button } from "@/components/ui/button"
import ConfigurableQuizPDF from "./ConfigurableQuizPDF"
import { FileDown, Lock } from 'lucide-react'
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  size = "lg"
}) => {
  const [isClient, setIsClient] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const { subscriptionStatus, canDownloadPDF, isLoading } = useSubscriptionStore()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isDataReady = useMemo(() => quizData && Object.keys(quizData).length > 0, [quizData])

  const quizSlug = useMemo(() => (isDataReady ? `${quizData?.title || "quiz"}.pdf` : "quiz.pdf"), [isDataReady, quizData])

  const isDisabled = useMemo(
    () => !isClient || !isDataReady || isLoading || !canDownloadPDF(),
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDownload}
            disabled={isDisabled}
            variant={variant}
            size={size}
            className={cn(
              "relative",
              isDisabled && "opacity-80",
              className
            )}
          >
            {isDownloading ? (
              <span className="flex items-center">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
                Downloading...
              </span>
            ) : (
              <>
                {isDisabled ? (
                  <Lock className="mr-2 h-4 w-4" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                {isDisabled ? "Upgrade to Download PDF" : "Download PDF"}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isDisabled 
            ? "Upgrade your subscription to download quizzes as PDF" 
            : "Download this quiz as a PDF file"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default QuizPDFDownload
