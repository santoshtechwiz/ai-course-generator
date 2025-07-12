"use client"

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { memo } from "react"

// Define the component props with configuration options
interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface QuizPDFProps {
  questions: Question[]
  title?: string
  config?: {
    highlightAnswers?: boolean
    highlightColor?: string
    showCopyright?: boolean
    copyrightText?: string
    copyrightPosition?: "left" | "center" | "right"
    copyrightFontSize?: number
    fontFamily?: string
    backgroundColor?: string
    questionColor?: string
    optionColor?: string
  }
}

const DocumentQuizPDF = memo(function DocumentQuizPDF({
  questions,
  title = "Generated Quiz",
  config = {},
}: QuizPDFProps) {
  const {
    highlightAnswers = true,
    highlightColor = "#1976D2",
    showCopyright = true,
    copyrightText = "© CourseAI",
    copyrightPosition = "center",
    copyrightFontSize = 10,
    fontFamily = "Helvetica",
    backgroundColor = "#FFFFFF",
    questionColor = "#111111",
    optionColor = "#222222",
  } = config

  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: backgroundColor,
      padding: 30,
      fontFamily: fontFamily,
      position: "relative",
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      fontWeight: "bold",
      textAlign: "center",
      color: questionColor,
    },
    section: {
      margin: 10,
      padding: 10,
      flexGrow: 1,
    },
    question: {
      fontSize: 14,
      marginBottom: 10,
      fontWeight: "bold",
      color: questionColor,
    },
    option: {
      fontSize: 12,
      marginBottom: 5,
      color: optionColor,
      padding: "3 0",
    },
    highlightedOption: {
      fontSize: 12,
      marginBottom: 5,
      color: highlightColor,
      fontWeight: "bold",
      backgroundColor: "#E3F2FD",
      padding: "3 5",
      borderRadius: 3,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 0,
      right: 0,
      textAlign: copyrightPosition,
      fontSize: copyrightFontSize,
      color: "#666666",
      paddingHorizontal: 30,
    },
    pageNumber: {
      position: "absolute",
      bottom: 30,
      right: 30,
      fontSize: 10,
      color: "#666666",
    },
    answerKey: {
      fontSize: 18,
      marginBottom: 15,
      fontWeight: "bold",
      textAlign: "center",
      color: questionColor,
    },
    answerTable: {
      width: "auto",
      margin: "10 0",
    },
    answerTableRow: {
      flexDirection: "row",
    },
    answerTableCell: {
      width: "50%",
      fontSize: 12,
      color: optionColor,
      padding: 4,
      borderBottom: "1 solid #e0e0e0",
    },
  })

  const chunkArray = (arr: any[], size: number) => {
    const result = []
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size))
    }
    return result
  }

  const QUESTIONS_PER_PAGE = 10
  const questionChunks = chunkArray(questions, QUESTIONS_PER_PAGE)

  return (
    <Document>
      {questionChunks.map((chunk, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {pageIdx === 0 && <Text style={styles.title}>{title}</Text>}
          {chunk.map((question, index) => (
            <View key={question.id} style={styles.section}>
              <Text style={styles.question}>{`${pageIdx * QUESTIONS_PER_PAGE + index + 1}. ${question.question}`}</Text>
              {question.options.map((option: string, optionIndex: number) => {
                const isCorrectAnswer = optionIndex === question.correctAnswer
                const optionStyle = highlightAnswers && isCorrectAnswer ? styles.highlightedOption : styles.option
                return (
                  <Text key={optionIndex} style={optionStyle}>
                    {`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                  </Text>
                )
              })}
              {question.explanation && (
                <Text style={{ fontSize: 11, color: "#616161", marginTop: 2, marginBottom: 5, fontStyle: "italic" }}>
                  {question.explanation}
                </Text>
              )}
            </View>
          ))}
          {showCopyright && <Text style={styles.footer}>{copyrightText}</Text>}
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      ))}

      <Page size="A4" style={styles.page}>
        <Text style={styles.answerKey}>Answer Key</Text>
        <View style={styles.answerTable}>
          {questions.map((question, index) => (
            <View key={`answer-${question.id}`} style={styles.answerTableRow}>
              <Text style={styles.answerTableCell}>{`${index + 1}. ${question.question}`}</Text>
              <Text style={styles.answerTableCell}>
                {`${String.fromCharCode(65 + question.correctAnswer)} - ${question.options[question.correctAnswer]}`}
              </Text>
            </View>
          ))}
        </View>
        {showCopyright && <Text style={styles.footer}>{copyrightText}</Text>}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
})

interface PDFDownloadButtonProps {
  questions: Question[]
  title: string
  className?: string
  variant?: "default" | "outline" | "secondary"
  size?: "sm" | "default" | "lg"
}

export const PDFDownloadButton = memo(function PDFDownloadButton({
  questions,
  title,
  className = "",
  variant = "outline",
  size = "default",
}: PDFDownloadButtonProps) {
  if (questions.length === 0) {
    return (
      <Button disabled variant={variant} size={size} className={className}>
        <Download className="mr-2 h-4 w-4" />
        No Questions to Export
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={<DocumentQuizPDF questions={questions} title={title} />}
      fileName={`${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_quiz.pdf`}
    >
      {({ loading }) => (
        <Button disabled={loading} variant={variant} size={size} className={className}>
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Preparing PDF..." : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  )
})

export default DocumentQuizPDF
