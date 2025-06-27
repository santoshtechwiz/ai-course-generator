"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { RotateCcw, Play, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import CertificateGenerator from "./CertificateGenerator"
import { cn } from "@/lib/utils"

interface ReplayPromptProps {
  onRestart: () => void
  onContinue: () => void
  showCertificatePrompt?: boolean
  onCertificatePrompted?: () => void
  courseName?: string
}

export const ReplayPrompt: React.FC<ReplayPromptProps> = ({
  onRestart,
  onContinue,
  showCertificatePrompt = false,
  onCertificatePrompted,
  courseName = "Course"
}) => {
  const [showCertificate, setShowCertificate] = useState(showCertificatePrompt)

  const handleContinue = () => {
    if (showCertificatePrompt && onCertificatePrompted) {
      onCertificatePrompted()
    }
    onContinue()
  }
  
  const handleRestart = () => {
    if (showCertificatePrompt && onCertificatePrompted) {
      onCertificatePrompted()
    }
    onRestart()
  }

  return (
    <motion.div
      className="bg-background rounded-lg shadow-xl max-w-lg w-full p-6"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {showCertificatePrompt ? "Congratulations!" : "Welcome Back!"}
          </h2>
          <p className="text-muted-foreground">
            {showCertificatePrompt 
              ? `You've completed ${courseName}. Would you like to get your certificate?`
              : `You've already completed ${courseName}. How would you like to continue?`
            }
          </p>
        </div>

        {showCertificate && showCertificatePrompt && (
          <div className={cn(
            "transition-all duration-300",
            showCertificate ? "opacity-100 max-h-[400px]" : "opacity-0 max-h-0 overflow-hidden"
          )}>
            <CertificateGenerator courseName={courseName} />
          </div>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleRestart}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restart Course
          </Button>
          
          <Button
            onClick={handleContinue}
            className="flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            Continue Where You Left Off
          </Button>
          
          {showCertificatePrompt && !showCertificate && (
            <Button
              variant="secondary"
              onClick={() => setShowCertificate(true)}
              className="flex items-center justify-center gap-2 mt-2"
            >
              <Award className="h-4 w-4" />
              Get Your Certificate
            </Button>
          )}
        </div>
      </div>
  </motion.div>
  )
}

export default ReplayPrompt
