"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from 'lucide-react'
import { Progress } from "@/components/ui/progress"

const PageLoader = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 90) {
          clearInterval(timer)
          return 90
        }
        return prevProgress + Math.random() * 10
      })
    }, 500)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 bg-background rounded-lg shadow-md">
      <motion.div
        className="text-primary"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-8 h-8" />
      </motion.div>
      <Progress value={progress} className="w-48" />
      <AnimatePresence mode="wait">
        <motion.p
          key={progress < 90 ? "loading" : "almost-done"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium text-muted-foreground"
        >
          {progress < 90 ? "Processing your request..." : "Almost done..."}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

export default PageLoader
