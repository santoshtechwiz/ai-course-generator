"use client"

import { useState, useEffect } from "react"
import { X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"

export function TrialBannerMobile() {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  const isMobile = useMobile()

  useEffect(() => {
    // Only show on mobile devices
    if (!isMobile) return

    // Check if the banner has been dismissed before
    const bannerDismissed = localStorage.getItem("trial_banner_mobile_dismissed")
    if (!bannerDismissed) {
      // Delay showing the mobile banner to avoid overwhelming the user
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isMobile])

  const handleDismiss = () => {
    setIsVisible(false)
    // Remember the dismissal for 3 days (shorter than desktop)
    localStorage.setItem("trial_banner_mobile_dismissed", Date.now().toString())
    // After 3 days, show the banner again
    setTimeout(
      () => {
        localStorage.removeItem("trial_banner_mobile_dismissed")
      },
      3 * 24 * 60 * 60 * 1000,
    )
  }

  const handleCTA = () => {
    router.push("/dashboard/subscription")
    handleDismiss()
  }

  if (!isMobile) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-4">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white/80 hover:text-white"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center mb-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mr-2">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <p className="font-medium text-white">Try our FREE PLAN today!</p>
            </div>

            <p className="text-sm text-white/90 mb-3">Get started with 5 tokens. No credit card required.</p>

            <Button onClick={handleCTA} className="w-full bg-white text-blue-600 hover:bg-white/90 font-medium">
              Start Free Trial
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

