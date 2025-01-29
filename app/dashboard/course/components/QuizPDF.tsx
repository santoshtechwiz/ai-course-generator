"use client"

import type React from "react"
import { useMemo } from "react"
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"

// Register custom fonts
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf", fontWeight: 300 },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#F9FAFB",
    padding: 40,
    fontFamily: "Roboto",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1F2937",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  questionSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 700,
    color: "#4B5563",
    marginBottom: 5,
  },
  question: {
    fontSize: 14,
    fontWeight: 500,
    color: "#1F2937",
    marginBottom: 10,
  },
  optionsContainer: {
    marginLeft: 15,
  },
  option: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 5,
  },
  answerSpace: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginTop: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
  },
  copyright: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "center",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 10,
    bottom: 30,
    right: 40,
    color: "#9CA3AF",
  },
})

interface Question {
  question: string
  options?: string[] | null
}

export interface QuizPDFProps {
  quizData: {
    title: string
    description?: string
    questions: Question[]
  }
  config?: {
    showOptions?: boolean
    showAnswerSpace?: boolean
    answerSpaceHeight?: number
  }
}

const ConfigurableQuizPDF: React.FC<QuizPDFProps> = ({ quizData, config = {} }) => {
  const { showOptions = true, showAnswerSpace = true, answerSpaceHeight = 40 } = config

  // Memoizing the parsed options for performance
  const questionsWithParsedOptions = useMemo(() => {
    return quizData?.questions.map((q) => ({
      ...q,
      options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options)) : null,
    }))
  }, [quizData?.questions])

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{quizData?.title}</Text>
          {quizData?.description && <Text style={styles.subtitle}>{quizData.description}</Text>}
        </View>
        {questionsWithParsedOptions?.map((q, i) => (
          <View key={i} style={styles.questionSection}>
            <Text style={styles.questionNumber}>{`Question ${i + 1}`}</Text>
            <Text style={styles.question}>{q.question}</Text>
            {showOptions && q.options && (
              <View style={styles.optionsContainer}>
                {q.options.map((option, j) => (
                  <Text key={j} style={styles.option}>
                    {`${String.fromCharCode(65 + j)}. ${option}`}
                  </Text>
                ))}
              </View>
            )}
            {showAnswerSpace && (!q.options || !showOptions) && (
              <View style={[styles.answerSpace, { height: answerSpaceHeight }]} />
            )}
          </View>
        ))}
        <View style={styles.footer}>
          <Text style={styles.copyright}>© CourseAI {new Date().getFullYear()}. All rights reserved.</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}

export default ConfigurableQuizPDF

