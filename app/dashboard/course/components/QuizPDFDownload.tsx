"use client"

import React, { useState, useEffect } from "react"
import { pdf } from "@react-pdf/renderer"
import type { QuizPDFProps } from "./ConfigurableQuizPDF"
import { Button } from "@/components/ui/button"
import ConfigurableQuizPDF from "./ConfigurableQuizPDF"
import { SiAdobe } from "react-icons/si"


const QuizPDFDownload: React.FC<QuizPDFProps> = ({ quizData }) => {
  const [isClient, setIsClient] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const quizSlug =quizData?.title+".pdf";

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  const handleDownload = async () => {
    setIsDownloading(true)
    let url = ""

    try {
      const blob = await pdf(<ConfigurableQuizPDF quizData={quizData} />).toBlob()
      url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `${quizSlug}-quiz.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error in download process:", error)
    } finally {
      if (url) URL.revokeObjectURL(url)
      setIsDownloading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={isDownloading} variant="outline" className="flex items-center gap-2">
      {isDownloading ? (
        <span className="animate-spin border-2 border-t-transparent border-gray-600 rounded-full w-4 h-4"></span>
      ) : (
        <SiAdobe className="h-5 w-5" />
      )}
      <span>Download PDF</span>
    </Button>
  )
}

export default QuizPDFDownload
