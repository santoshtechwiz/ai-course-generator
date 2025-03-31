"use client"

import { useState, useEffect } from "react"
import { X, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export function TrialBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if the banner has been dismissed before
    const bannerDismissed = localStorage.getItem("trial_banner_dismissed")
    if (!bannerDismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    // Remember the dismissal for 7 days
    localStorage.setItem("trial_banner_dismissed", Date.now().toString())
    // After 7 days, show the banner again
    setTimeout(
      () => {
        localStorage.removeItem("trial_banner_dismissed")
      },
      7 * 24 * 60 * 60 * 1000,
    )
  }

  const handleCTA = () => {
    router.push("/dashboard/subscription")
    handleDismiss()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white py-3 px-4 sm:px-6">
            <div className="container mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center mb-3 sm:mb-0">
                  <div className="hidden sm:flex h-10 w-10 rounded-full bg-white/20 items-center justify-center mr-3">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-medium text-lg">
                      Try our <span className="font-bold">FREE PLAN</span> today!
                    </p>
                    <p className="text-sm text-white/80">
                      Get started with 5 tokens. <span className="font-bold">No credit card required.</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleCTA}
                    className="bg-white text-blue-600 hover:bg-white/90 font-medium px-4 py-2 rounded-md transition-all duration-200 transform hover:scale-105 shadow-md"
                  >
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <button
                    onClick={handleDismiss}
                    className="text-white/80 hover:text-white transition-colors duration-200"
                    aria-label="Dismiss banner"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Animated gradient border at the bottom */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-[length:200%_100%] animate-gradient" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

