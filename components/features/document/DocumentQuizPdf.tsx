import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#E4E4E4",
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  question: {
    fontSize: 14,
    marginBottom: 10,
  },
  option: {
    fontSize: 12,
    marginBottom: 5,
  },
})

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface QuizPDFProps {
  questions: Question[]
}

export function DocumentQuizPDF({ questions }: QuizPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {questions.map((question, index) => (
          <View key={question.id} style={styles.section}>
            <Text style={styles.question}>{`${index + 1}. ${question.question}`}</Text>
            {question.options.map((option, optionIndex) => (
              <Text key={optionIndex} style={styles.option}>
                {`${String.fromCharCode(97 + optionIndex)}. ${option}`}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}

