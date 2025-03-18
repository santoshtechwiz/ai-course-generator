"use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// Define the component props with configuration options
interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface QuizPDFProps {
  questions: Question[]
  title?: string
  // Configuration options
  config?: {
    // Highlighting options
    highlightAnswers?: boolean
    highlightColor?: string
    // Copyright options
    showCopyright?: boolean
    copyrightText?: string
    copyrightPosition?: "left" | "center" | "right"
    copyrightFontSize?: number
    // Styling options
    fontFamily?: string
    backgroundColor?: string
    questionColor?: string
    optionColor?: string
  }
}

export default function DocumentQuizPDF({ questions, title = "Generated Quiz", config = {} }: QuizPDFProps) {
  // Set default configuration values
  const {
    highlightAnswers = true, // Changed default to true to show answers
    highlightColor = "#4CAF50",
    showCopyright = true,
    copyrightText = "© CourseAI",
    copyrightPosition = "center",
    copyrightFontSize = 10,
    fontFamily = "Helvetica",
    backgroundColor = "#FFFFFF",
    questionColor = "#333333",
    optionColor = "#555555",
  } = config

  // Create dynamic styles based on configuration
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
      backgroundColor: "#e6f7e6", // Light green background for highlighted options
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
    answerItem: {
      fontSize: 12,
      marginBottom: 5,
      color: optionColor,
    },
  })

  return (
    <Document>
      {/* Quiz Questions Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>

        {questions.map((question, index) => (
          <View key={question.id} style={styles.section}>
            <Text style={styles.question}>{`${index + 1}. ${question.question}`}</Text>
            {question.options.map((option, optionIndex) => {
              // Determine if this option is the correct answer
              const isCorrectAnswer = optionIndex === question.correctAnswer
              // Apply highlighting style if enabled and this is the correct answer
              const optionStyle = highlightAnswers && isCorrectAnswer ? styles.highlightedOption : styles.option

              return (
                <Text key={optionIndex} style={optionStyle}>
                  {`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                </Text>
              )
            })}
          </View>
        ))}

        {/* Copyright notice */}
        {showCopyright && <Text style={styles.footer}>{copyrightText}</Text>}

        {/* Page number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Answer Key Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.answerKey}>Answer Key</Text>

        {questions.map((question, index) => (
          <View key={`answer-${question.id}`} style={styles.section}>
            <Text style={styles.answerItem}>
              {`${index + 1}. ${String.fromCharCode(65 + question.correctAnswer)} - ${question.options[question.correctAnswer]}`}
            </Text>
          </View>
        ))}

        {/* Copyright notice */}
        {showCopyright && <Text style={styles.footer}>{copyrightText}</Text>}

        {/* Page number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}

