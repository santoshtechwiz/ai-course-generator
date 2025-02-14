"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { pdf } from "@react-pdf/renderer"
import type { QuizPDFProps } from "./ConfigurableQuizPDF"
import { Button } from "@/components/ui/button"
import ConfigurableQuizPDF from "./ConfigurableQuizPDF"
import { SiAdobe } from "react-icons/si"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { GlobalLoader } from "@/app/components/GlobalLoader"

interface QuizPDFDownloadProps extends QuizPDFProps {
  config?: {
    showOptions?: boolean
    showAnswerSpace?: boolean
    answerSpaceHeight?: number
    showAnswers?: boolean
  }
}

const QuizPDFDownload: React.FC<QuizPDFDownloadProps> = ({ quizData, config }) => {
  const [isClient, setIsClient] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const { subscriptionStatus } = useSubscriptionStore()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isDataReady = useMemo(() => {
    return quizData && Object.keys(quizData).length > 0
  }, [quizData])

  const quizSlug = useMemo(() => {
    return isDataReady ? `${quizData.title}.pdf` : "quiz.pdf"
  }, [isDataReady, quizData])

  const isDisabled = useMemo(() => {
    return (
      !isClient ||
      !isDataReady ||
      !subscriptionStatus ||
      subscriptionStatus.subscriptionPlan === "FREE" ||
      subscriptionStatus.subscriptionPlan === "BASIC"
    )
  }, [isClient, isDataReady, subscriptionStatus])

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
    return <GlobalLoader />
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading || isDisabled}
      variant="outline"
      className="flex items-center gap-2 sm:px-4 sm:py-2 p-2"
      aria-label={isDisabled ? "Upgrade to Download" : "Download PDF"}
    >
      {isDownloading ? (
        <span className="animate-spin border-2 border-t-transparent border-gray-600 rounded-full w-5 h-5"></span>
      ) : (
        <SiAdobe className="h-5 w-5" />
      )}
      <span className="hidden sm:inline">{isDisabled ? "Upgrade to Download" : " PDF"}</span>
    </Button>
  )
}

export default QuizPDFDownload

