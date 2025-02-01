"use client"

import React, { useState, useEffect } from "react"
import { pdf } from "@react-pdf/renderer"
import type { QuizPDFProps } from "./ConfigurableQuizPDF"
import { Button } from "@/components/ui/button"
import ConfigurableQuizPDF from "./ConfigurableQuizPDF"
import { SiAdobe } from "react-icons/si"
import useSubscriptionStore from "@/store/useSubscriptionStore"

const QuizPDFDownload: React.FC<QuizPDFProps> = ({ quizData }) => {
  const [isClient, setIsClient] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const quizSlug = quizData?.title ? `${quizData.title}.pdf` : "quiz.pdf"
  const { subscriptionStatus } = useSubscriptionStore()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const isDisabled =
    !isClient ||
    !subscriptionStatus ||
    subscriptionStatus.subscriptionPlan === "FREE" ||
    subscriptionStatus.subscriptionPlan === "BASIC"

  const handleDownload = async () => {
    if (isDownloading || isDisabled) return

    setIsDownloading(true)
    let url = ""

    try {
      const blob = await pdf(<ConfigurableQuizPDF quizData={quizData} />).toBlob()
      url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = quizSlug
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error in download process:", error)
      alert("Failed to download the PDF. Please try again.")
    } finally {
      if (url) URL.revokeObjectURL(url)
      setIsDownloading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading || isDisabled}
      
      variant="outline"
      className="flex items-center gap-2"
      aria-label={isDisabled ? "Upgrade to Download" : "Download PDF"}
    >
      {isClient ? (
        <>
          {isDownloading ? (
            <span className="animate-spin border-2 border-t-transparent border-gray-600 rounded-full w-4 h-4"></span>
          ) : (
            <SiAdobe className="h-5 w-5" />
          )}
          <span>{isDisabled ? "Upgrade to Download" : "Download PDF"}</span>
        </>
      ) : (
        <span>Loading...</span>
      )}
    </Button>
  )
}

export default QuizPDFDownload