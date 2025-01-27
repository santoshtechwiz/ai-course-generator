import type React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  question: {
    fontSize: 14,
    marginBottom: 5,
  },
  option: {
    fontSize: 12,
    marginLeft: 10,
  },
  copyright: {
    position: "absolute",
    fontSize: 10,
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "grey",
  },
})

interface QuizPDFProps {
  quizData: {
    title: string
    questions: {
      question: string
      options: string[]
    }[]
  }
}

const QuizPDF: React.FC<QuizPDFProps> = ({ quizData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>{quizData.title}</Text>
        {quizData?.questions?.map((q, i) => (
          <View key={i}>
            <Text style={styles.question}>{`${i + 1}. ${q.question}`}</Text>
            {q.options.map((option, j) => (
              <Text key={j} style={styles.option}>
                {`${String.fromCharCode(97 + j)}) ${option}`}
              </Text>
            ))}
          </View>
        ))}
      </View>
      <Text style={styles.copyright}>© {new Date().getFullYear()} Your Company Name. All rights reserved.</Text>
    </Page>
  </Document>
)

export default QuizPDF

