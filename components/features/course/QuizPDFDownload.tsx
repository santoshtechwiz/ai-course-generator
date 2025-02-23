"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { pdf } from "@react-pdf/renderer"
import type { QuizPDFProps } from "./ConfigurableQuizPDF"
import { Button } from "@/components/ui/button"
import ConfigurableQuizPDF from "./ConfigurableQuizPDF"
import { SiAdobe } from "react-icons/si"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import PageLoader from "@/components/ui/loader"

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
  const { subscriptionStatus, canDownloadPDF, isLoading } = useSubscriptionStore()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isDataReady = useMemo(() => quizData && Object.keys(quizData).length > 0, [quizData])

  const quizSlug = useMemo(() => (isDataReady ? `${quizData.title}.pdf` : "quiz.pdf"), [isDataReady, quizData])

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
    return <PageLoader />
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isDisabled}
      variant="outline"
      className="flex items-center justify-center min-w-[40px] h-10 px-2 sm:px-4 rounded-lg transition-all duration-300"
      aria-label={isDisabled ? "Upgrade to Download" : "Download PDF"}
    >
      {isDownloading ? (
        <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <SiAdobe className="w-5 h-5 text-red-600" />
      )}
      <span className="hidden sm:inline ml-2">{isDisabled ? "Upgrade" : "PDF"}</span>
    </Button>
  )
}

export default QuizPDFDownload

