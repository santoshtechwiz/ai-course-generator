"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Award, Download, ArrowRight, X, Loader2, Share2 } from "lucide-react"
import { PDFDownloadLink } from "@react-pdf/renderer"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import confetti from "canvas-confetti"
import CertificateGenerator from "./CertificateGenerator"

export const CourseCompletionOverlay = ({
  onClose,
  onWatchAnotherCourse,
  courseName,
}: {
  onClose: () => void
  onWatchAnotherCourse: () => void
  courseName: string
}) => {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Student"
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  // Trigger confetti on mount
  useEffect(() => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // since particles fall down, start a bit higher than random
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

  const handleDownload = () => {
    setIsDownloading(true)
    setTimeout(() => {
      setIsDownloading(false)
      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been successfully downloaded.",
      })
    }, 2000)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${userName}'s Certificate for ${courseName}`,
          text: `Check out my certificate for completing ${courseName} on CourseAI!`,
          url: `https://courseai.com/certificate/${encodeURIComponent(courseName)}`,
        })
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard
          .writeText(`https://courseai.com/certificate/${encodeURIComponent(courseName)}`)
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
          className="relative bg-card rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-8 text-center">
            <div className="mb-8 flex justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                className="rounded-full bg-primary/10 p-6"
              >
                <Award className="h-16 w-16 text-primary" />
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-3xl font-bold">Course Completed!</h2>
              <p className="text-muted-foreground text-lg">
                Congratulations on completing <span className="font-semibold text-foreground">{courseName}</span>!
                You've earned your certificate.
              </p>

              <div className="bg-primary/5 rounded-lg p-4 mt-4 border border-primary/10">
                <p className="text-sm text-muted-foreground">
                  This certificate verifies that <span className="font-medium text-foreground">{userName}</span> has
                  successfully completed all chapters and assessments in this course.
                </p>
              </div>
            </motion.div>

            <div className="grid gap-4 mt-8">
              <PDFDownloadLink
                document={<CertificateGenerator  courseName={courseName} />}
                fileName={`${courseName.replace(/\s+/g, "_")}_Certificate.pdf`}
                onClick={handleDownload}
              >
                {({ blob, url, loading, error }) => (
                  <Button disabled={loading || isDownloading} className="w-full bg-primary hover:bg-primary/90">
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

              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Certificate
              </Button>

              <Button variant="secondary" onClick={onWatchAnotherCourse}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Explore More Courses
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CourseCompletionOverlay
