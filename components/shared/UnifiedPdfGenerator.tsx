"use client"

import React, { useState, useMemo, useRef, memo } from "react"
import { Document, Page, Text, View, StyleSheet, Font, pdf, PDFDownloadLink } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, Lock, Loader2 } from "lucide-react"
import useSubscription from "@/hooks/use-subscription"
import { useOwnership } from "@/lib/ownership"
import { marked } from "marked"

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    { 
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf", 
      fontWeight: 300 
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    { 
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", 
      fontWeight: 700 
    },
  ],
})

// Base styles for all PDF types
const createStyles = (config: PdfConfig = {}) => StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: config.backgroundColor || "#FFFFFF",
    padding: config.padding || 30,
    fontFamily: config.fontFamily || "Roboto",
    position: "relative",
  },
  title: {
    fontSize: config.titleSize || 24,
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: config.primaryColor || "#1F2937",
  },
  subtitle: {
    fontSize: 14,
    color: config.secondaryColor || "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
    padding: 10,
  },
  question: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "bold",
    color: config.primaryColor || "#1F2937",
  },
  option: {
    fontSize: 12,
    marginBottom: 5,
    color: config.textColor || "#374151",
    paddingLeft: 10,
  },
  highlightedOption: {
    fontSize: 12,
    marginBottom: 5,
    color: config.highlightColor || "#10B981",
    fontWeight: "bold",
    backgroundColor: config.highlightBackground || "#F0FDF4",
    padding: "3 5",
    paddingLeft: 10,
  },
  answer: {
    fontSize: 12,
    color: config.answerColor || "#10B981",
    marginTop: 5,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  codeBlock: {
    fontFamily: "Courier",
    fontSize: 11,
    backgroundColor: config.codeBackground || "#F3F4F6",
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 10,
    color: config.codeColor || "#1F2937",
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 10,
    color: config.textColor || "#374151",
    lineHeight: 1.5,
  },
  heading1: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
    color: config.primaryColor || "#DC2626",
  },
  heading2: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    color: config.primaryColor || "#10B981",
  },
  heading3: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 14,
    color: config.primaryColor || "#6366F1",
  },
  listItem: {
    fontSize: 12,
    marginBottom: 5,
    color: config.textColor || "#6B7280",
    paddingLeft: 15,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: config.copyrightPosition || "center",
    fontSize: config.copyrightSize || 10,
    color: config.copyrightColor || "#9CA3AF",
    paddingHorizontal: 30,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: config.copyrightColor || "#9CA3AF",
  },
  flashcardFront: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: config.primaryColor || "#1F2937",
  },
  flashcardBack: {
    fontSize: 12,
    color: config.textColor || "#374151",
    backgroundColor: config.highlightBackground || "#F9FAFB",
    padding: 10,
    borderRadius: 4,
  },
  answerSpace: {
    height: config.answerSpaceHeight || 40,
    borderBottomWidth: 1,
    borderBottomColor: config.borderColor || "#E5E7EB",
    marginTop: 10,
  },
})

// Type definitions
interface BaseQuestion {
  id?: string
  question: string
  explanation?: string
}

interface MCQQuestion extends BaseQuestion {
  options: string[]
  correctAnswer: number
  answer?: string
}

interface OpenEndedQuestion extends BaseQuestion {
  answer: string
}

interface FlashCard {
  id?: string
  question: string
  answer: string
}

interface PdfConfig {
  // Styling
  backgroundColor?: string
  primaryColor?: string
  secondaryColor?: string
  textColor?: string
  highlightColor?: string
  highlightBackground?: string
  answerColor?: string
  codeBackground?: string
  codeColor?: string
  borderColor?: string
  
  // Layout
  padding?: number
  titleSize?: number
  fontFamily?: string
  answerSpaceHeight?: number
  
  // Content options
  showAnswers?: boolean
  highlightCorrectAnswers?: boolean
  showExplanations?: boolean
  showAnswerSpace?: boolean
  showOptions?: boolean
  
  // Footer
  showCopyright?: boolean
  copyrightText?: string
  copyrightPosition?: "left" | "center" | "right"
  copyrightSize?: number
  copyrightColor?: string
  
  // Page options
  questionsPerPage?: number
  includeAnswerKey?: boolean
}

type PdfContentType = "quiz" | "flashcards" | "markdown" | "course"

interface PdfData {
  title: string
  description?: string
  questions?: (MCQQuestion | OpenEndedQuestion)[]
  flashCards?: FlashCard[]
  markdown?: string
  chapterName?: string
  quizType?: string
}

interface UnifiedPdfGeneratorProps {
  data: PdfData
  type: PdfContentType
  config?: PdfConfig
  fileName?: string
  buttonText?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  downloadMethod?: "blob" | "link" // blob for manual download, link for PDFDownloadLink
  isOwner?: boolean // Legacy prop - will be auto-detected if not provided
}

// Helper function to render inline markdown styles
const renderInlineStyles = (text: string, style: any) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={index} style={[style, { fontWeight: "bold" }]}>
          {part.slice(2, -2)}
        </Text>
      )
    } else if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <Text key={index} style={[style, { fontStyle: "italic" }]}>
          {part.slice(1, -1)}
        </Text>
      )
    }
    return (
      <Text key={index} style={style}>
        {part}
      </Text>
    )
  })
}

// Parse markdown to structured content
const parseMarkdown = (markdown: string, styles: any) => {
  const tokens = marked.lexer(markdown)
  return tokens.map((token, index) => {
    switch (token.type) {
      case "heading":
        const HeadingStyle = token.depth === 1 ? styles.heading1 : 
                           token.depth === 2 ? styles.heading2 : styles.heading3
        return (
          <Text key={index} style={HeadingStyle}>
            {renderInlineStyles(token.text, HeadingStyle)}
          </Text>
        )
      case "paragraph":
        return (
          <Text key={index} style={styles.paragraph}>
            {renderInlineStyles(token.text, styles.paragraph)}
          </Text>
        )
      case "list":
        return (
          <View key={index}>
            {(token as any).items.map((item: any, itemIndex: number) => (
              <Text key={itemIndex} style={styles.listItem}>
                • {renderInlineStyles(item.text, styles.listItem)}
              </Text>
            ))}
          </View>
        )
      default:
        return null
    }
  })
}

// Quiz PDF Component
const QuizPDF = memo(({ data, config }: { data: PdfData; config: PdfConfig }) => {
  const styles = createStyles(config)
  const questions = data.questions || []
  
  const chunkArray = (arr: any[], size: number) => {
    const result = []
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size))
    }
    return result
  }

  const questionsPerPage = config.questionsPerPage || 10
  const questionChunks = chunkArray(questions, questionsPerPage)

  return (
    <Document>
      {questionChunks.map((chunk, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {pageIdx === 0 && (
            <View>
              <Text style={styles.title}>{data.title}</Text>
              {data.description && <Text style={styles.subtitle}>{data.description}</Text>}
            </View>
          )}
          
          {chunk.map((question: any, index: number) => (
            <View key={question.id || index} style={styles.section}>
              <Text style={styles.question}>
                {`${pageIdx * questionsPerPage + index + 1}. ${question.question}`}
              </Text>
              
              {question.options && config.showOptions !== false && (
                <View>
                  {question.options.map((option: string, optionIndex: number) => {
                    const isCorrect = optionIndex === question.correctAnswer
                    const optionStyle = config.highlightCorrectAnswers && config.showAnswers && isCorrect 
                      ? styles.highlightedOption 
                      : styles.option
                    return (
                      <Text key={optionIndex} style={optionStyle}>
                        {`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                      </Text>
                    )
                  })}
                </View>
              )}
              
              {config.showAnswerSpace && !question.options && (
                <View style={styles.answerSpace} />
              )}
              
              {config.showAnswers && question.answer && (
                <Text style={styles.answer}>Answer: {question.answer}</Text>
              )}
              
              {config.showExplanations && question.explanation && (
                <Text style={[styles.paragraph, { fontStyle: "italic", marginTop: 5 }]}>
                  Explanation: {question.explanation}
                </Text>
              )}
            </View>
          ))}
          
          {config.showCopyright && (
            <Text style={styles.footer}>
              {config.copyrightText || `© CourseAI ${new Date().getFullYear()}`}
            </Text>
          )}
          
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      ))}
      
      {config.includeAnswerKey && questions.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Answer Key</Text>
          <View style={styles.section}>
            {questions.map((question: any, index: number) => (
              <View key={`answer-${question.id || index}`} style={{ marginBottom: 10 }}>
                <Text style={styles.question}>{`${index + 1}. ${question.question}`}</Text>
                {question.options && question.correctAnswer !== undefined && (
                  <Text style={styles.answer}>
                    {`${String.fromCharCode(65 + question.correctAnswer)} - ${question.options[question.correctAnswer]}`}
                  </Text>
                )}
                {question.answer && !question.options && (
                  <Text style={styles.answer}>Answer: {question.answer}</Text>
                )}
              </View>
            ))}
          </View>
          
          {config.showCopyright && (
            <Text style={styles.footer}>
              {config.copyrightText || `© CourseAI ${new Date().getFullYear()}`}
            </Text>
          )}
        </Page>
      )}
    </Document>
  )
})

// Flashcards PDF Component
const FlashcardsPDF = memo(({ data, config }: { data: PdfData; config: PdfConfig }) => {
  const styles = createStyles(config)
  const flashcards = data.flashCards || []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.title}</Text>
        {data.description && <Text style={styles.subtitle}>{data.description}</Text>}
        
        {flashcards.map((card, index) => (
          <View key={card.id || index} style={styles.section}>
            <Text style={styles.flashcardFront}>
              {`Card ${index + 1}: ${card.question}`}
            </Text>
            {config.showAnswers && (
              <View style={styles.flashcardBack}>
                <Text>{card.answer}</Text>
              </View>
            )}
            {!config.showAnswers && config.showAnswerSpace && (
              <View style={styles.answerSpace} />
            )}
          </View>
        ))}
        
        {config.showCopyright && (
          <Text style={styles.footer}>
            {config.copyrightText || `© CourseAI ${new Date().getFullYear()}`}
          </Text>
        )}
        
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
})

// Markdown PDF Component
const MarkdownPDF = memo(({ data, config }: { data: PdfData; config: PdfConfig }) => {
  const styles = createStyles(config)
  const parsedContent = data.markdown ? parseMarkdown(data.markdown, styles) : []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.title || data.chapterName || "Document"}</Text>
        <View style={styles.section}>
          {parsedContent}
        </View>
        
        {config.showCopyright && (
          <Text style={styles.footer}>
            {config.copyrightText || `© CourseAI ${new Date().getFullYear()}`}
          </Text>
        )}
        
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
})

// Main PDF Component
const UnifiedPDF = memo(({ data, type, config }: { data: PdfData; type: PdfContentType; config: PdfConfig }) => {
  switch (type) {
    case "quiz":
      return <QuizPDF data={data} config={config} />
    case "flashcards":
      return <FlashcardsPDF data={data} config={config} />
    case "markdown":
    case "course":
      return <MarkdownPDF data={data} config={config} />
    default:
      return <QuizPDF data={data} config={config} />
  }
})

// Main Component
const UnifiedPdfGenerator: React.FC<UnifiedPdfGeneratorProps> = ({
  data,
  type,
  config = {},
  fileName,
  buttonText,
  className = "",
  variant = "outline",
  size = "default",
  downloadMethod = "blob",
  isOwner = false
}) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { canDownloadPdf } = useSubscription()
  
  // Centralized ownership detection - automatically detects if user owns the content
  const ownership = useOwnership(data)
  
  // Use detected ownership or fallback to prop (for backward compatibility)
  const finalIsOwner = ownership.isOwner || isOwner
  
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const isDataReady = useMemo(() => {
    if (!data) return false
    switch (type) {
      case "quiz":
        return data.questions && data.questions.length > 0
      case "flashcards":
        return data.flashCards && data.flashCards.length > 0
      case "markdown":
      case "course":
        return data.markdown && data.markdown.length > 0
      default:
        return false
    }
  }, [data, type])

  const defaultFileName = useMemo(() => {
    const title = data?.title || data?.chapterName || "document"
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    return `${sanitizedTitle}_${type}.pdf`
  }, [data, type])

  const finalFileName = fileName || defaultFileName
  const finalButtonText = buttonText || "Download PDF"
  
  // Allow download if user has subscription OR is the owner of the content
  const canDownload = canDownloadPdf || finalIsOwner
  const isDisabled = !canDownload || !isDataReady || isDownloading || !isClient

  const handleBlobDownload = async () => {
    if (isDisabled) return

    setIsDownloading(true)
    let url = ""

    try {
      const blob = await pdf(<UnifiedPDF data={data} type={type} config={config} />).toBlob()
      url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = finalFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("PDF download error:", error)
      alert("Failed to download the PDF. Please try again.")
    } finally {
      if (url) URL.revokeObjectURL(url)
      setIsDownloading(false)
    }
  }

  if (!isClient) return null

  const buttonContent = isDownloading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Preparing PDF...
    </>
  ) : canDownload ? (
    <>
      <Download className="mr-2 h-4 w-4" />
      {finalButtonText}
    </>
  ) : (
    <>
      <Lock className="mr-2 h-4 w-4" />
      Upgrade to Download
    </>
  )

  const tooltipContent = canDownload
    ? `Download this ${type} as a PDF file`
    : finalIsOwner 
      ? "Download available for content owners (auto-detected)"
      : ownership.detectionMethod === 'not_authenticated'
        ? "Sign in to access downloads"
        : "Upgrade your subscription to enable PDF downloads"

  if (downloadMethod === "link" && canDownload && isDataReady) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <PDFDownloadLink
              document={<UnifiedPDF data={data} type={type} config={config} />}
              fileName={finalFileName}
            >
              {({ loading }) => (
                <Button
                  disabled={loading || isDisabled}
                  variant={variant}
                  size={size}
                  className={className}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing PDF...
                    </>
                  ) : (
                    buttonContent
                  )}
                </Button>
              )}
            </PDFDownloadLink>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-primary text-primary-foreground border">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            onClick={handleBlobDownload}
            disabled={isDisabled}
            variant={variant}
            size={size}
            className={className}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-primary text-primary-foreground border">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default UnifiedPdfGenerator
export type { PdfData, PdfConfig, PdfContentType, UnifiedPdfGeneratorProps }
