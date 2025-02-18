"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const PageLoader = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer)
          return 100
        }
        return prevProgress + 1
      })
    }, 50)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-background">
      <div className="relative w-32 h-32">
        <AnimatePresence>
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              className="absolute inset-0 border-4 border-primary rounded-full"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.6,
              }}
            />
          ))}
        </AnimatePresence>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">{progress}%</span>
        </div>
      </div>
      <motion.p
        className="mt-4 text-lg font-medium text-foreground/80"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        Generating AI magic...
      </motion.p>
      <div className="mt-2 w-64 h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}

export default PageLoader

