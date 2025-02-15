import type React from "react"
import { Document, Page, Text, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"
import { useSession } from "next-auth/react"

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#E4F0F5",
    padding: 30,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#2C3E50",
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2980B9",
  },
  content: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: "#34495E",
  },
  name: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#E74C3C",
  },
  courseName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#27AE60",
  },
  date: {
    fontSize: 14,
    marginTop: 30,
    textAlign: "center",
    color: "#7F8C8D",
  },
})

// Certificate component
const Certificate = ({ userName, courseName }: { userName: string; courseName: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Certificate of Completion</Text>
      <Text style={styles.title}>Congratulations!</Text>
      <Text style={styles.content}>This is to certify that</Text>
      <Text style={styles.name}>{userName}</Text>
      <Text style={styles.content}>has successfully completed the course</Text>
      <Text style={styles.courseName}>{courseName}</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
    </Page>
  </Document>
)

interface CertificateGeneratorProps {
  courseName: string
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ courseName }) => {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Student"

  return (
    <PDFDownloadLink
      document={<Certificate userName={userName} courseName={courseName} />}
      fileName={`${courseName.replace(/\s+/g, "_")}_Certificate.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <>
          {loading ? "Generating certificate..." : "Download Certificate"}
        </>
      )}
    </PDFDownloadLink>
  )
}

export default CertificateGenerator

