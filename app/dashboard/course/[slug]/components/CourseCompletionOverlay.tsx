"use client"

import { useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, Download, ArrowRight, X, Loader2, Share2 } from "lucide-react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import confetti from "canvas-confetti"

import Link from "next/link"
import CertificateGenerator from "./CertificateGenerator"

export const CourseCompletionOverlay = ({
  onClose,
  onWatchAnotherCourse,
  courseName,
  fetchRelatedCourses,
}: {
  onClose: () => void
  onWatchAnotherCourse: () => void
  courseName?: string
  fetchRelatedCourses?: () => Promise<any[]>
}) => {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)
  const [relatedCourses, setRelatedCourses] = useState<any[]>([])

  // Get user name from session or use default
  const userName = session?.user?.name || "Student"

  // Ensure courseName is safe for filenames
  const safeCourseName = courseName || "Course"

  // Handle certificate download
  const handleDownload = () => {
    setIsDownloading(true)
    // We'll reset the downloading state after a short delay
    // since the actual download happens via PDFDownloadLink
    setTimeout(() => {
      setIsDownloading(false)
      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been successfully downloaded.",
      })
    }, 2000)
  }

  // Handle certificate sharing
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
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Link Copied",
          description: "Certificate link copied to clipboard!",
        })
      }
    } catch (error) {
      console.error("Error sharing certificate:", error)
    }
  }

  // Memoize values to prevent unnecessary re-renders
  const userNameMemo = useMemo(() => {
    const name = session?.user?.name || "Student"
    return name ? String(name).trim() || "Student" : "Student"
  }, [session?.user?.name])

  const safeCourseNameMemo = useMemo(() => {
    return courseName ? String(courseName).trim() || "Course" : "Course"
  }, [courseName])

  // Memoize the confetti effect to prevent re-creation
  const triggerConfetti = useCallback(() => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  // Trigger confetti on mount
  useEffect(() => {
    const cleanup = triggerConfetti()
    return cleanup
  }, [triggerConfetti])

  // Fetch related courses
  useEffect(() => {
    if (fetchRelatedCourses) {
      fetchRelatedCourses().then((courses) => {
        setRelatedCourses(courses || [])
      })
    }
  }, [fetchRelatedCourses])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative bg-card rounded-xl shadow-2xl w-full max-w-2xl mx-auto my-8 max-h-[85vh] flex flex-col"
        >
          <div className="p-6 sm:p-8 overflow-hidden">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Course Completed! 🎉</h2>
                <p className="text-muted-foreground mb-6">
                  Congratulations on completing{" "}
                  <span className="font-semibold text-foreground">{safeCourseName}</span>! You've earned your certificate.
                </p>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 mt-4 border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  This certificate verifies that{" "}
                  <span className="font-medium text-foreground">{userName}</span> has successfully completed all chapters
                  and assessments in this course.
                </p>
              </div>
            </motion.div>

            <div className="grid gap-4 mt-8">
              {/* Only render when both required props are available */}
              {userNameMemo && safeCourseNameMemo && (
                <PDFDownloadLink
                  document={<CertificateGenerator courseName={safeCourseNameMemo} userName={userNameMemo} />}
                  fileName={`${safeCourseName.replace(/\s+/g, "_")}_Certificate.pdf`}
                  className="mx-auto max-w-xs w-full"
                >
                  {({ blob, url, loading, error }) => (
                    <Button
                      disabled={loading || isDownloading}
                      className="w-full bg-primary hover:bg-primary/90 py-2 px-4 h-auto text-sm"
                      onClick={handleDownload}
                    >
                      {loading || isDownloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating certificate...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download Certificate
                        </>
                      )}
                    </Button>
                  )}
                </PDFDownloadLink>
              )}

              <Button
                variant="outline"
                onClick={handleShare}
                className="mx-auto max-w-xs w-full text-sm py-2 px-4 h-auto"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Certificate
              </Button>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button variant="outline" onClick={onWatchAnotherCourse}>
                Find Another Course
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CourseCompletionOverlay
