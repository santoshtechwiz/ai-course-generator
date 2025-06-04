"use client"

import type React from "react"
import { Document, Page, Text, StyleSheet, PDFDownloadLink, View } from "@react-pdf/renderer"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Download, Share2, CheckCircle, Loader2, Award, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useDispatch, useSelector } from "react-redux"
import { trackCertificateDownload, generateCertificate, shareCertificate } from "@/store/slices/certificateSlice"

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
  logoContainer: {
    alignSelf: "center",
    marginBottom: 30,
    width: 120,
    height: 120,
    backgroundColor: "#f8fafc",
    borderRadius: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2 solid #e2e8f0",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
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

// Fixed Certificate component with logo fallback
export const Certificate = ({
  userName = "Student",
  courseName = "Course",
}: { userName?: string; courseName?: string }) => {
  const safeUserName = userName || "Student"
  const safeCourseName = courseName || "Course"
  const safeCertificateId = `${safeUserName.replace(/\s+/g, "-").toLowerCase()}_${safeCourseName.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border} />
        <Text style={styles.watermark}>CERTIFIED</Text>

        {/* Logo fallback - using text instead of image to avoid 404 */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>CA</Text>
        </View>

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
          This certificate is proudly presented by CourseAI • Verify this certificate at: https://courseai.com/verify/
          {safeCertificateId}
        </Text>
      </Page>
    </Document>
  )
}

interface CertificateGeneratorProps {
  courseName?: string
  isEligible?: boolean
  progress?: number
  courseId?: number
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  courseName = "Course",
  isEligible = true,
  progress = 100,
  courseId,
}) => {
  const { data: session } = useSession()
  const dispatch = useDispatch()
  const { toast } = useToast()

  const userName = session?.user?.name || "Student"
  const safeCourseName = courseName || "Course"
  const safeFileName = `${safeCourseName.replace(/\s+/g, "_")}_Certificate.pdf`

  // Redux state
  const certificateState = useSelector((state: any) => state.certificate || {})
  const { isGenerating, isSharing, downloadCount, lastGenerated } = certificateState

  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Track certificate view
    if (isEligible && courseId) {
      dispatch(
        trackCertificateDownload({
          courseId,
          courseName: safeCourseName,
          action: "view",
        }),
      )
    }
  }, [isEligible, courseId, safeCourseName, dispatch])

  const handleDownload = async () => {
    try {
      // Dispatch Redux action for certificate generation
      const result = await dispatch(
        generateCertificate({
          courseId,
          courseName: safeCourseName,
          userName,
          progress,
        }),
      )

      if (result.type.endsWith("/fulfilled")) {
        setShowSuccess(true)
        toast({
          title: "Certificate Generated",
          description: "Your certificate has been successfully generated and is ready for download.",
        })
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Error generating certificate:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate certificate. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      const result = await dispatch(
        shareCertificate({
          courseId,
          courseName: safeCourseName,
          userName,
        }),
      )

      if (result.type.endsWith("/fulfilled")) {
        const shareData = result.payload

        if (navigator.share && shareData.canUseNativeShare) {
          await navigator.share({
            title: shareData.title,
            text: shareData.text,
            url: shareData.url,
          })
        } else {
          // Fallback for browsers that don't support the Web Share API
          await navigator.clipboard.writeText(shareData.url)
          toast({
            title: "Link Copied",
            description: "Certificate link copied to clipboard!",
          })
        }
      }
    } catch (error) {
      console.error("Error sharing certificate:", error)
      toast({
        title: "Share Failed",
        description: "Failed to share certificate. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!isEligible) {
    return (
      <motion.div
        className="flex flex-col items-center space-y-4 p-4 sm:p-6 bg-muted/30 rounded-lg border border-muted"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center w-full">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-muted rounded-full">
              <Award className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-semibold mb-2">Certificate Not Available Yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Complete {Math.round(100 - progress)}% more of the course to unlock your certificate.
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-3 mb-4 max-w-sm mx-auto">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-muted-foreground mb-4">
            <span className="text-sm font-medium">{progress}% Complete</span>
          </div>

          {/* Requirements */}
          <div className="mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg text-left max-w-md mx-auto">
            <h4 className="font-medium text-sm mb-3 text-center">Requirements to earn certificate:</h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center flex-shrink-0 ${
                    progress >= 100 ? "bg-green-500" : "bg-muted-foreground/30"
                  }`}
                >
                  {progress >= 100 && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <span>Complete 100% of the course videos</span>
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-3 bg-muted-foreground/30 flex-shrink-0"></div>
                <span>Pass the final assessment</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex flex-col items-center space-y-4 p-4 sm:p-6 bg-primary/5 rounded-lg border border-primary/20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-4 w-full">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Award className="h-6 w-6 text-primary" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-semibold mb-2">Course Completed!</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Congratulations on completing this course. Download your certificate to showcase your achievement.
        </p>

        {downloadCount > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Downloaded {downloadCount} time{downloadCount !== 1 ? "s" : ""}
            {lastGenerated && ` • Last generated ${new Date(lastGenerated).toLocaleDateString()}`}
          </p>
        )}
      </div>

      {showSuccess && (
        <motion.div
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-4 py-2 rounded-md text-sm flex items-center mb-2 w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Certificate downloaded successfully!</span>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <PDFDownloadLink
          document={<Certificate userName={userName} courseName={safeCourseName} />}
          fileName={safeFileName}
          className="flex-1"
          onClick={handleDownload}
        >
          {({ blob, url, loading, error }) => (
            <Button
              disabled={loading || isGenerating}
              className="w-full bg-primary hover:bg-primary/90 h-auto py-3 text-sm font-medium"
            >
              {loading || isGenerating ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Download className="mr-2 h-4 w-4" />
                  Download Certificate
                </span>
              )}
            </Button>
          )}
        </PDFDownloadLink>

        <Button
          onClick={handleShare}
          variant="outline"
          disabled={isSharing}
          className="flex-1 h-auto py-3 text-sm font-medium"
        >
          {isSharing ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sharing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Share2 className="mr-2 h-4 w-4" />
              Share Certificate
            </span>
          )}
        </Button>
      </div>

      {/* Certificate Preview */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-muted/50 w-full max-w-md">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span className="text-xs">
            Certificate will include your name, course completion date, and verification ID
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default CertificateGenerator
