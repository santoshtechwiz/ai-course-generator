"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSessionContext } from '@/hooks/useSessionContext'
import { CheckCircle, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * BreadcrumbWelcome Component
 * 
 * Shows a welcome message after authentication with context about what the user was doing.
 * Automatically dismisses after 5 seconds or can be manually dismissed.
 */
export function BreadcrumbWelcome() {
  const { status } = useSession()
  const { getIntendedAction, clearIntendedAction } = useSessionContext()
  const [show, setShow] = useState(false)
  const [action, setAction] = useState<ReturnType<typeof getIntendedAction>>(null)
  
  useEffect(() => {
    // Only show once when user becomes authenticated
    if (status === 'authenticated') {
      const intendedAction = getIntendedAction()
      
      if (intendedAction) {
        setAction(intendedAction)
        setShow(true)
        
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
          handleDismiss()
        }, 5000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [status, getIntendedAction])
  
  const handleDismiss = () => {
    setShow(false)
    setTimeout(() => {
      clearIntendedAction()
      setAction(null)
    }, 300) // Wait for animation to complete
  }
  
  if (!action) return null
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-gradient-to-r from-success/10 to-success/5 dark:from-success/5 dark:to-success/10 border border-success/20 dark:border-success/20 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-success/20 dark:bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-success">
                    Welcome back!
                  </h4>
                  <Sparkles className="w-4 h-4 text-success" />
                </div>
                <p className="text-sm text-success/80 dark:text-success/90">
                  Let&apos;s continue {action.description}
                </p>
              </div>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-success hover:text-success/80 dark:hover:text-success/70 transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
