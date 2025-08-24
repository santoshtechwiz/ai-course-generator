import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NextChapterAutoOverlayProps {
  visible: boolean
  nextChapterTitle: string
  countdown: number
  onContinue: () => void
  onCancel: () => void
}

const overlayVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: "0%", opacity: 1, transition: { type: "spring", stiffness: 400, damping: 32 } },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.3 } },
}

export const NextChapterAutoOverlay: React.FC<NextChapterAutoOverlayProps> = ({
  visible,
  nextChapterTitle,
  countdown,
  onContinue,
  onCancel,
}) => {
  const [internalCountdown, setInternalCountdown] = useState(countdown)

  useEffect(() => {
    if (!visible) return
    setInternalCountdown(countdown)
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setInternalCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onContinue()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [visible, countdown, onContinue])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          className={cn(
            "fixed left-1/2 bottom-0 z-50 w-full max-w-2xl -translate-x-1/2 bg-gradient-to-t from-black/90 via-black/70 to-transparent rounded-t-xl shadow-lg flex flex-col items-center justify-center p-6 sm:p-8",
            "transition-all duration-300"
          )}
          style={{ minHeight: "40vh" }}
        >
          <div className="w-full text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Moving to next chapter</h3>
            <div className="text-lg sm:text-xl text-primary font-semibold mb-4">{nextChapterTitle}</div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-3xl sm:text-4xl font-bold text-white">{internalCountdown}</span>
              <span className="text-base text-white/70">seconds</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="w-full sm:w-auto" onClick={onContinue}>
                Continue Now
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NextChapterAutoOverlay
