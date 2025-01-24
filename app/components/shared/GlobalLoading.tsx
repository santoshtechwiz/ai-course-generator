"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <motion.div
    className="h-1 bg-gradient-to-r from-primary via-secondary to-accent fixed top-0 left-0 right-0 z-[10000]"
    initial={{ width: 0 }}
    animate={{ width: `${value}%` }}
    transition={{ duration: 0.3 }}
  />
)

const AIBrain: React.FC = () => {
  return (
    <motion.div
      className="w-32 h-32 relative flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-24 h-24 bg-primary rounded-full flex items-center justify-center"
        animate={{
          y: ["0%", "-10%", "0%"],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="w-20 h-20 border-4 border-background rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute w-3 h-3 bg-primary/50 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: index * 0.3,
          }}
          style={{
            left: `${50 + 45 * Math.cos((index * Math.PI) / 3)}%`,
            top: `${50 + 45 * Math.sin((index * Math.PI) / 3)}%`,
          }}
        />
      ))}
    </motion.div>
  )
}

export function GlobalLoading(): JSX.Element {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    setProgress(0)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return Math.min(prev + 10, 100)
      })
    }, 100)

    const hideLoader = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // Adjust this value to control how long the loader is shown

    return () => {
      clearInterval(timer)
      clearTimeout(hideLoader)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn("fixed inset-0 z-[9999]", "bg-background/80 dark:bg-background/90", "backdrop-blur-sm")}
        >
          <ProgressBar value={progress} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <AIBrain />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="flex space-x-2"
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{
                    y: ["0%", "-50%", "0%"],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: index * 0.1,
                  }}
                  className="w-3 h-3 bg-primary rounded-full"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

