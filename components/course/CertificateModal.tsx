"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

// Simple date formatter utility function since it's not in utils.ts
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

interface CertificateModalProps {
  show: boolean
  onClose: () => void
  courseId: number
  courseTitle: string
  userName: string | null
  totalLessons: number
}

const CertificateModal: React.FC<CertificateModalProps> = ({
  show,
  onClose,
  courseId,
  courseTitle,
  userName,
  totalLessons,
}) => {
  const certificateId = `CERT-${courseId}-${Date.now().toString().slice(-6)}`
  const completionDate = new Date()
  
  // Generate PDF version of the certificate (placeholder)
  const handleDownload = () => {
    // In a real implementation, this would generate a PDF
    console.log("Downloading certificate:", certificateId)
    alert("Certificate download functionality would be implemented here")
  }

  // Handle sharing the certificate (placeholder)  
  const handleShare = () => {
    // In a real implementation, this would open sharing options
    if (navigator.share) {
      navigator.share({
        title: `Course Certificate: ${courseTitle}`,
        text: `I've completed the "${courseTitle}" course!`,
        url: window.location.href,
      }).catch(console.error)
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert("Certificate URL copied to clipboard"))
        .catch(console.error)
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-card border shadow-lg rounded-xl w-full max-w-3xl relative overflow-hidden"
          >
            {/* Close button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Certificate content */}
            <div className="p-8 md:p-12">
              <div className="border-4 border-primary/30 p-8 rounded-lg bg-gradient-to-br from-background to-muted/30">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Certificate of Completion</h2>
                  <p className="text-muted-foreground text-sm">This certifies that</p>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl md:text-3xl font-serif italic text-primary">
                    {userName || "Anonymous Learner"}
                  </h3>
                  <div className="w-48 h-0.5 bg-primary/30 mx-auto my-4" />
                </div>
                
                <div className="text-center mb-8">
                  <p className="text-muted-foreground">has successfully completed</p>
                  <h4 className="text-xl md:text-2xl font-bold mt-2 mb-1">{courseTitle}</h4>
                  <p className="text-sm text-muted-foreground">
                    A comprehensive course consisting of {totalLessons} lessons
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-center text-sm mt-8 sm:mt-12">
                  <div>
                    <p className="text-muted-foreground">Completion Date</p>
                    <p className="font-medium">{formatDate(completionDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Certificate ID</p>
                    <p className="font-medium">{certificateId}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-6 bg-muted/30 border-t flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Verify this certificate online at <span className="font-medium">ailearning.com/verify</span>
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleShare}>Share</Button>
                <Button onClick={handleDownload}>Download PDF</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(CertificateModal)
