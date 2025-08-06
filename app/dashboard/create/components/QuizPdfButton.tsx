"use client"

import React from "react"
import UnifiedPdfGenerator from "@/components/shared/UnifiedPdfGenerator"
import type { PdfData, PdfConfig } from "@/components/shared/UnifiedPdfGenerator"

interface QuizPDFProps {
  disabled?: boolean
  quizData: {
    title: string
    description?: string
    questions: any[]
  }
  config?: {
    showOptions?: boolean
    showAnswerSpace?: boolean
    answerSpaceHeight?: number
    showAnswers?: boolean
  }
}

interface QuizPDFDownloadProps extends QuizPDFProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  isOwner?: boolean
}

const QuizPDFDownload: React.FC<QuizPDFDownloadProps> = ({
  quizData,
  config,
  className,
  variant = "default",
  size = "default",
  isOwner = false,
}) => {
  const pdfData: PdfData = {
    title: quizData?.title || "Quiz",
    description: quizData?.description,
    questions: quizData?.questions?.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      answer: q.answer,
      explanation: q.explanation
    })) || []
  }

  const pdfConfig: PdfConfig = {
    showAnswers: config?.showAnswers || false,
    showOptions: config?.showOptions !== false,
    showAnswerSpace: config?.showAnswerSpace !== false,
    answerSpaceHeight: config?.answerSpaceHeight || 40,
    highlightCorrectAnswers: false,
    showExplanations: false,
    includeAnswerKey: false,
    showCopyright: true,
    copyrightText: `© CourseAI ${new Date().getFullYear()}`,
    questionsPerPage: 8,
    primaryColor: "#1F2937",
    highlightColor: "#10B981",
  }

  return (
    <UnifiedPdfGenerator
      data={pdfData}
      type="quiz"
      config={pdfConfig}
      buttonText="Download PDF"
      variant={variant}
      size={size}
      className={className}
      downloadMethod="blob"
      isOwner={isOwner}
    />
  )
}

export default QuizPDFDownload
