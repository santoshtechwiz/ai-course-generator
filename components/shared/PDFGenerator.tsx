"use client"
import React from "react"
import UnifiedPdfGenerator from "./UnifiedPdfGenerator"
import type { PdfData, PdfConfig } from "./UnifiedPdfGenerator"
import useSubscription from "@/hooks/use-subscription"

interface PDFGeneratorProps {
  markdown: string
  chapterName: string
  isOwner?: boolean
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ markdown, chapterName, isOwner = false }) => {
  const { data: subscription } = useSubscription()

  const pdfData: PdfData = {
    title: chapterName,
    markdown: markdown,
    chapterName: chapterName
  }

  const pdfConfig: PdfConfig = {
    showCopyright: true,
    copyrightText: `© CourseAI ${new Date().getFullYear()}`,
    primaryColor: "#1D4ED8",
    secondaryColor: "#DC2626", 
    textColor: "#374151",
    highlightColor: "#10B981",
  }

  const isDisabled = !subscription || subscription.currentPlan === "FREE" || subscription.currentPlan === "BASIC"

  return (
    <div className="flex justify-end mt-4">
      <UnifiedPdfGenerator
        data={pdfData}
        type="markdown"
        config={pdfConfig}
        fileName={`${chapterName.replace(/\s+/g, "_")}_summary.pdf`}
        buttonText={isDisabled ? "Upgrade to Download" : "Download PDF"}
        variant="outline"
        className="flex items-center gap-2"
        isOwner={isOwner}
      />
    </div>
  )
}

export default PDFGenerator
