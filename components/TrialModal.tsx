"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Zap, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { SubscriptionPlanType } from "@/app/dashboard/subscription/components/subscription.config"

interface TrialModalProps {
  isSubscribed: boolean
  currentPlan: SubscriptionPlanType | null
}

export function TrialModal({ isSubscribed, currentPlan }: TrialModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  const shouldShowModal = useCallback(() => {
    if (isSubscribed && currentPlan !== "FREE") return false
    const modalDismissed = localStorage.getItem("trial_modal_dismissed")
    if (modalDismissed) {
      const dismissedTime = Number.parseInt(modalDismissed, 10)
      if (Date.now() - dismissedTime < 60 * 1000) return false
    }
    return true
  }, [isSubscribed, currentPlan])

  useEffect(() => {
    if (shouldShowModal()) setIsVisible(true)
    const intervalId = setInterval(() => {
      if (shouldShowModal()) setIsVisible(true)
    }, 60 * 1000)
    return () => clearInterval(intervalId)
  }, [shouldShowModal])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("trial_modal_dismissed", Date.now().toString())
  }

  const handleCTA = () => {
    router.push("/dashboard/subscription")
    handleDismiss()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 w-full max-w-lg"
          >
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-6 text-white relative">
              <button onClick={handleDismiss} className="absolute top-4 right-4 text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Try our FREE PLAN</h3>
              </div>
              <p className="text-white/90 mt-2">Get started with our powerful learning platform at no cost.</p>
            </div>

            <div className="p-6">
              <h4 className="text-lg font-semibold mb-4">What's included:</h4>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>5 tokens to generate quizzes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Multiple-choice question generator</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Up to 5 questions per quiz</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>No credit card required</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleCTA}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 text-lg rounded-md transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="flex-1 border-slate-300 dark:border-slate-600 py-3 px-6 text-lg"
                >
                  Maybe Later
                </Button>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 text-center text-sm text-slate-500 dark:text-slate-400">
              Upgrade anytime to unlock more features and tokens
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default TrialModal
