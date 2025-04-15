import type React from "react"
import { Document, Page, Text, StyleSheet, PDFDownloadLink, Image } from "@react-pdf/renderer"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#2C3E50",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
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
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#7F8C8D",
    fontSize: 10,
  },
})

// Certificate component
const Certificate = ({ userName, courseName }: { userName: string; courseName: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Image src="/path/to/courseai-logo.png" style={styles.logo} />
      <Text style={styles.header}>Certificate of Completion</Text>
      <Text style={styles.title}>Congratulations!</Text>
      <Text style={styles.content}>This is to certify that</Text>
      <Text style={styles.name}>{userName}</Text>
      <Text style={styles.content}>has successfully completed the course</Text>
      <Text style={styles.courseName}>{courseName}</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      <Text style={styles.footer}>
        This certificate is proudly presented by CourseAI Verify this certificate at: https://courseai.com/verify
      </Text>
    </Page>
  </Document>
)

interface CertificateGeneratorProps {
  courseName: string
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ courseName }) => {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Student"

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${userName}'s Certificate for ${courseName}`,
          text: `Check out my certificate for completing ${courseName} on CourseAI!`,
          url: `https://courseai.io/certificate/${encodeURIComponent(courseName)}`,
        })
      } else {
        // Fallback for browsers that don't support the Web Share API
        alert("Sharing is not supported on this browser. You can copy the certificate link manually.")
      }
    } catch (error) {
      console.error("Error sharing certificate:", error)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <PDFDownloadLink
        document={<Certificate userName={userName} courseName={courseName} />}
        fileName={`${courseName.replace(/\s+/g, "_")}_Certificate.pdf`}
      >
        {({ blob, url, loading, error }) => (
          <Button disabled={loading}>{loading ? "Generating certificate..." : "Download Certificate"}</Button>
        )}
      </PDFDownloadLink>
      {/* <Button onClick={handleShare} variant="outline">
        <Share2 className="mr-2 h-4 w-4" />
        Share Certificate
      </Button> */}
    </div>
  )
}

export default CertificateGenerator

