"use client"

import React, { useEffect } from "react"
import { Document, Page, Text, StyleSheet, View } from "@react-pdf/renderer"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useState, useCallback, useMemo } from "react"
import { Download, Share2, CheckCircle, Loader2, Award } from "lucide-react"
import { useToast } from "@/hooks"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { motion } from "framer-motion"

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

// Certificate PDF component - Improved with better null checks and error handling
const Certificate = React.memo(({ userName, courseName }: { userName: string; courseName: string }) => {
  // Ensure we always have valid strings for both props
  const safeUserName = userName ? String(userName).trim() : "Student"
  const safeCourseName = courseName ? String(courseName).trim() : "Course"

  if (!safeUserName || !safeCourseName) {
    console.error("Certificate props missing or invalid after sanitization", { userName, courseName })
    return null
  }

  const certificateId = `${safeUserName.replace(/\s+/g, "-").toLowerCase()}_${safeCourseName.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border} />
        <Text style={styles.watermark}>CERTIFIED</Text>
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
          {certificateId}
        </Text>
      </Page>
    </Document>
  )
})

Certificate.displayName = "Certificate"

interface CertificateGeneratorProps {
  courseName?: string
  userName?: string
  isEligible?: boolean
  progress?: number
  onDownload?: () => void
  onShare?: () => void
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  courseName = "Course",
  userName,
  isEligible = true,
  progress = 100,
  onDownload,
  onShare,
}) => {
  // Fix for useSession not being in SessionProvider context
  // Use try/catch to handle potential errors when useSession is not available
  const sessionData = (() => {
    try {
      // Return the session data if available
      return useSession()?.data || null
    } catch (error) {
      // If useSession throws an error, return null
      console.warn("Session provider not available:", error)
      return null
    }
  })()
  
  const { toast } = useToast()

  // Memoize values to prevent unnecessary re-renders - ensure they're never null/undefined
  const effectiveUserName = useMemo(() => {
    const name = userName || sessionData?.user?.name || "Student"
    return name ? String(name).trim() || "Student" : "Student"
  }, [userName, sessionData?.user?.name])
  
  const safeCourseName = useMemo(() => {
    return courseName ? String(courseName).trim() || "Course" : "Course"
  }, [courseName])
  
  const safeFileName = useMemo(() => 
    `${safeCourseName.replace(/\s+/g, "_") || "Course"}_Certificate.pdf`, 
  [safeCourseName])

  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [documentReady, setDocumentReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Make sure the document is ready before rendering
  useEffect(() => {
    // Small delay to ensure client-side rendering is complete
    const timer = setTimeout(() => setDocumentReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload()
      return
    }

    setIsGenerating(true)
    setError(null)
    
    // Simulate generation delay for better UX
    setTimeout(() => {
      setIsGenerating(false)
      setShowSuccess(true)
      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been successfully downloaded.",
      })
      setTimeout(() => setShowSuccess(false), 3000)
    }, 1500)
  }, [onDownload, toast])

  const handleShare = useCallback(async () => {
    if (onShare) {
      onShare()
      return
    }

    try {
      const shareTitle = `${effectiveUserName}'s Certificate for ${safeCourseName}`
      const shareText = `Check out my certificate for completing ${safeCourseName} on CourseAI!`
      const shareUrl = `https://courseai.io/certificate/${encodeURIComponent(safeCourseName)}`

      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link Copied",
          description: "Certificate link copied to clipboard!",
        })
      }
    } catch (error) {
      console.error("Error sharing certificate:", error)
      setError("Failed to share certificate. Please try again.")
    }
  }, [effectiveUserName, safeCourseName, onShare, toast])

  // Error display
  if (error) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">
            Something went wrong
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            {error}
          </p>
          <Button 
            onClick={() => setError(null)} 
            variant="outline" 
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!isEligible) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-muted/30 rounded-lg border border-muted">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Certificate Not Available Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Complete {Math.round(100 - progress)}% more of the course to unlock your certificate.
          </p>
          <div className="w-full bg-muted rounded-full h-2.5 mb-4">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Award className="h-5 w-5" />
            <span className="text-sm">Keep learning to unlock your certificate!</span>
          </div>
        </div>
      </div>
    )
  }

  // If this component is being rendered for PDF only
  if (userName && !sessionData) {
    return <Certificate userName={effectiveUserName} courseName={safeCourseName} />
  }

  // Don't render PDF until document is ready and we're client-side
  if (!documentReady) {
    return (
      <div className="flex items-center justify-center p-6 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-primary/5 rounded-lg border border-primary/20">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold mb-2">Course Completed!</h3>
        <p className="text-sm text-muted-foreground">
          Congratulations on completing this course. Download your certificate to showcase your achievement.
        </p>
      </div>

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-4 py-2 rounded-md text-sm flex items-center mb-2 w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Certificate downloaded successfully!
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {/* Wrap PDFDownloadLink in an error boundary to prevent render crashes */}
        <div className="flex-1">
          {documentReady && (
            <PDFDownloadLink
              document={<Certificate userName={effectiveUserName} courseName={safeCourseName} />}
              fileName={safeFileName}
              className="w-full"
            >
              {({ blob, url, loading, error: pdfError }) => {
                if (pdfError) {
                  console.error("PDF generation error:", pdfError)
                  return (
                    <Button
                      disabled
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      <span className="mr-2">⚠️</span>
                      PDF Generation Failed
                    </Button>
                  )
                }

                return (
                  <Button
                    disabled={loading || isGenerating || !effectiveUserName || !safeCourseName}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleDownload}
                  >
                    {loading || isGenerating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                        />
                        Generating certificate...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download Certificate
                      </>
                    )}
                  </Button>
                )
              }}
            </PDFDownloadLink>
          )}
        </div>

        <Button 
          onClick={handleShare} 
          variant="outline" 
          className="flex-1 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Certificate
        </Button>
      </div>
    </div>
  )
}

export default CertificateGenerator
