"use client"

import type React from "react"
import { Document, Page, Text, StyleSheet, PDFDownloadLink, Image, View } from "@react-pdf/renderer"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Download, Share2, CheckCircle, Loader2, Award } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: "center",
    color: "#1a365d",
    fontWeight: "bold",
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#2563eb",
  },
  content: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
    color: "#1e293b",
  },
  name: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#1e40af",
    borderBottom: "1 solid #cbd5e1",
    paddingBottom: 10,
  },
  courseName: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#0f766e",
  },
  date: {
    fontSize: 16,
    marginTop: 40,
    textAlign: "center",
    color: "#475569",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    borderTop: "1 solid #e2e8f0",
    paddingTop: 20,
  },
  border: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 5,
    borderColor: "#e2e8f0",
    borderStyle: "solid",
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 100,
    color: "#f1f5f9",
    opacity: 0.3,
    zIndex: -1,
  },
})

// Fixed Certificate component with safe handling of userName
export const Certificate = ({ userName = "Student", courseName = "Course" }: { userName?: string; courseName?: string }) => {
  // Safely handle userName and courseName to prevent undefined errors
  const safeUserName = userName || "Student"
  const safeCourseName = courseName || "Course"
  
  // Generate a safe certificate ID that won't cause errors
  const safeCertificateId = `${safeUserName.replace(/\s+/g, "-").toLowerCase()}_${safeCourseName.replace(/\s+/g, "-").toLowerCase()}`
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border} />
        <Text style={styles.watermark}>CERTIFIED</Text>
        <Image src="/logo.png" style={styles.logo} />
        <Text style={styles.header}>CERTIFICATE OF COMPLETION</Text>
        <Text style={styles.title}>Achievement Unlocked</Text>
        <Text style={styles.content}>This is to certify that</Text>
        <Text style={styles.name}>{safeUserName}</Text>
        <Text style={styles.content}>has successfully completed the course</Text>
        <Text style={styles.courseName}>{safeCourseName}</Text>
        <Text style={styles.date}>
          Completed on{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
        <Text style={styles.footer}>
          This certificate is proudly presented by CourseAI • Verify this certificate at: https://courseai.com/verify/{safeCertificateId}
        </Text>
      </Page>
    </Document>
  )
}

interface CertificateGeneratorProps {
  courseName?: string
  isEligible?: boolean
  progress?: number
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  courseName = "Course",  // Provide default value
  isEligible = true,
  progress = 100,
}) => {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Student"  // Ensure userName has a fallback
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()
  
  // Ensure courseName is safe to use
  const safeCourseName = courseName || "Course"
  
  // Create a safe filename for download that won't cause errors
  const safeFileName = `${safeCourseName.replace(/\s+/g, "_")}_Certificate.pdf`

  const handleDownload = () => {
    setIsGenerating(true)
    // Simulate generation delay for better UX
    setTimeout(() => {
      setIsGenerating(false)
      setShowSuccess(true)
      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been successfully downloaded.",
        variant: "success",
      })
      setTimeout(() => setShowSuccess(false), 3000)
    }, 1500)
  }

  const handleShare = async () => {
    try {
      const shareTitle = `${userName}'s Certificate for ${safeCourseName}`
      const shareText = `Check out my certificate for completing ${safeCourseName} on CourseAI!`
      const shareUrl = `https://courseai.io/certificate/${encodeURIComponent(safeCourseName)}`

      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            toast({
              title: "Link Copied",
              description: "Certificate link copied to clipboard!",
            })
          })
          .catch(() => {
            toast({
              title: "Copy Failed",
              description: "Failed to copy link. Please try again.",
              variant: "destructive",
            })
          })
      }
    } catch (error) {
      console.error("Error sharing certificate:", error)
    }
  }

  if (!isEligible) {
    return (
      <motion.div
        className="flex flex-col items-center space-y-4 p-6 bg-muted/30 rounded-lg border border-muted"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Certificate Not Available Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Complete {Math.round(100 - progress)}% more of the course to unlock your certificate.
          </p>
          <div className="w-full bg-muted rounded-full h-2.5 mb-4">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Award className="h-5 w-5" />
            <span className="text-sm">Keep learning to unlock your certificate!</span>
          </div>

          {/* Add more specific requirements */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-left">
            <h4 className="font-medium text-sm mb-2">Requirements to earn certificate:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${progress >= 100 ? "bg-green-500" : "bg-muted-foreground/30"}`}
                >
                  {progress >= 100 && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                Complete 100% of the course videos
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2 bg-muted-foreground/30"></div>
                Pass the final assessment
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex flex-col items-center space-y-4 p-6 bg-primary/5 rounded-lg border border-primary/20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold mb-2">Course Completed!</h3>
        <p className="text-sm text-muted-foreground">
          Congratulations on completing this course. Download your certificate to showcase your achievement.
        </p>
      </div>

      {showSuccess && (
        <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-4 py-2 rounded-md text-sm flex items-center mb-2 animate-in fade-in slide-in-from-top-5 duration-300 w-full">
          <CheckCircle className="h-4 w-4 mr-2" />
          Certificate downloaded successfully!
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <PDFDownloadLink
          document={<Certificate userName={userName} courseName={safeCourseName} />}
          fileName={safeFileName}
          className="flex-1 max-w-xs mx-auto"
          onClick={handleDownload}
        >
          {({ blob, url, loading, error }) => (
            <Button disabled={loading || isGenerating} className="w-full bg-primary hover:bg-primary/90 h-auto py-2">
              {loading || isGenerating ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating certificate...
                </span>
              ) : (
                <span className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  Download Certificate
                </span>
              )}
            </Button>
          )}
        </PDFDownloadLink>

        <Button onClick={handleShare} variant="outline" className="flex-1 max-w-xs mx-auto h-auto py-2">
          <Share2 className="mr-2 h-4 w-4" />
          Share Certificate
        </Button>
      </div>
    </motion.div>
  )
}

export default CertificateGenerator
