"use client"

import React, { memo } from "react"
import UnifiedPdfGenerator from "@/components/shared/UnifiedPdfGenerator"
import type { PdfData, PdfConfig } from "@/components/shared/UnifiedPdfGenerator"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface EnhancedPDFDownloadButtonProps {
  questions: Question[]
  title: string
  className?: string
  variant?: "default" | "outline" | "secondary"
  size?: "sm" | "default" | "lg"
  isOwner?: boolean
}

const EnhancedPDFDownloadButton = memo(function EnhancedPDFDownloadButton({
  questions,
  title,
  className = "",
  variant = "outline",
  size = "default",
  isOwner = false,
}: EnhancedPDFDownloadButtonProps) {
  const pdfData: PdfData = {
    title: title,
    questions: questions.map((question) => ({
      id: question.id,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    })),
  }

  const pdfConfig: PdfConfig = {
    showAnswers: true,
    highlightCorrectAnswers: true,
    showExplanations: true,
    includeAnswerKey: true,
    showCopyright: true,
    copyrightText: "© CourseAI",
    questionsPerPage: 10,
    primaryColor: "#111111",
    secondaryColor: "#222222",
    highlightColor: "#1976D2",
    highlightBackground: "#E3F2FD",
  }

  return (
    <UnifiedPdfGenerator
      data={pdfData}
      type="quiz"
      config={pdfConfig}
      fileName={`${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_quiz.pdf`}
      buttonText={questions.length === 0 ? "No Questions to Export" : "Download PDF"}
      variant={variant}
      size={size}
      className={className}
      downloadMethod="link"
      isOwner={isOwner}
    />
  )
})

export default EnhancedPDFDownloadButton