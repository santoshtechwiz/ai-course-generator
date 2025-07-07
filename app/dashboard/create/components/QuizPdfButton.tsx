"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { pdf } from "@react-pdf/renderer"
import type { QuizPDFProps } from "./ConfigurableQuizPDF"
import { Button } from "@/components/ui/button"
import ConfigurableQuizPDF from "./ConfigurableQuizPDF"
import { Download, Lock, Loader2 } from "lucide-react"

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
  variant = "default",
  size = "default",
}) => {
  const [isClient, setIsClient] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const { canDownloadPdf } = useSubscription()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isDataReady = useMemo(() => quizData && Object.keys(quizData).length > 0, [quizData])
  const quizSlug = useMemo(
    () => (isDataReady ? `${quizData?.title || "quiz"}.pdf` : "quiz.pdf"),
    [isDataReady, quizData],
  )

  const isDisabled = !canDownloadPdf || !isDataReady || isDownloading

  const handleDownload = async () => {
    if (isDisabled) return

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
      console.error("PDF download error:", error)
      alert("Failed to download the PDF. Please try again.")
    } finally {
      if (url) URL.revokeObjectURL(url)
      setIsDownloading(false)
    }
  }

  if (!isClient) return null

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDownload}
            disabled={isDisabled}
            variant={variant}
            size={size}
            className={className}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing PDF...
              </>
            ) : canDownloadPdf ? (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Upgrade 
              </>
            )}

        
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-primary text-primary-foreground border">
          {canDownloadPdf
            ? "Download this quiz as a PDF file"
            : "Upgrade your subscription to enable PDF downloads"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default QuizPDFDownload
