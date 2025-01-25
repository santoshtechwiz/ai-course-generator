"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import useSubscriptionStore from "@/store/useSubscriptionStore"

import { useApiLoading } from "@/hooks/useApiLoading"

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <motion.div
    className="h-2 bg-gradient-to-r from-primary via-secondary to-accent fixed top-0 left-0 right-0 z-[10001]"
    style={{
      scaleX: value / 100,
      transformOrigin: "0%",
    }}
    initial={{ scaleX: 0 }}
    animate={{ scaleX: value / 100 }}
    transition={{ duration: 0.3 }}
  />
)

const AIBrain: React.FC = () => {
  return (
    <motion.div
      className="w-40 h-40 relative flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="w-24 h-24 border-4 border-background rounded-full flex items-center justify-center"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <motion.div
            className="w-16 h-16 bg-accent rounded-full"
            animate={{
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </motion.div>
      {[...Array(8)].map((_, index) => (
        <motion.div
          key={index}
          className="absolute w-4 h-4 bg-primary/50 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: index * 0.2,
          }}
          style={{
            left: `${50 + 60 * Math.cos((index * Math.PI) / 4)}%`,
            top: `${50 + 60 * Math.sin((index * Math.PI) / 4)}%`,
          }}
        />
      ))}
    </motion.div>
  )
}

export function GlobalLoading(): JSX.Element {
  const { isLoading: isSubscriptionLoading } = useSubscriptionStore()
  const [isRouteChanging, setIsRouteChanging] = useState(false)
  const [progress, setProgress] = useState(0)
  const isApiLoading = useApiLoading()
  //const pathname = usePathname()
  //const searchParams = useSearchParams()

  useEffect(() => {
    setIsRouteChanging(true)
    setProgress(0)
    const timer = setTimeout(() => {
      setIsRouteChanging(false)
    }, 500) // Adjust this delay as needed

    return () => clearTimeout(timer)
  }, [isApiLoading]) // Removed unnecessary dependencies: pathname, searchParams

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return Math.min(prev + 10, 100)
      })
    }, 100)

    return () => {
      clearInterval(timer)
    }
  }, [isRouteChanging, isApiLoading])

  const isLoading = isSubscriptionLoading || isRouteChanging || isApiLoading

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn("fixed inset-0 z-[9999]", "bg-background/95 dark:bg-background/95", "backdrop-blur-md")}
        >
          <ProgressBar value={progress} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <AIBrain />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-lg font-semibold text-primary mb-4"
            >
              Loading...
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex space-x-3"
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                    delay: index * 0.2,
                  }}
                  className="w-4 h-4 bg-primary rounded-full"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

