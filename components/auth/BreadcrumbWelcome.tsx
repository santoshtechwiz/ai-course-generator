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
          <div className="bg-[var(--color-card)] border-4 border-black rounded-md shadow-[4px_4px_0_#000] p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-primary)] rounded-md flex items-center justify-center border-4 border-black shadow-[2px_2px_0_#000]">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm text-[var(--color-text)]">
                    Welcome back!
                  </h4>
                  <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
                <p className="text-sm text-[var(--color-text)]/80">
                  Let&apos;s continue {action.description}
                </p>
              </div>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-[var(--color-text)] hover:text-[var(--color-text)]/80 transition-colors border-4 border-black bg-[var(--color-bg)] shadow-[2px_2px_0_#000] p-1 rounded-md hover:shadow-[4px_4px_0_#000]"
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
