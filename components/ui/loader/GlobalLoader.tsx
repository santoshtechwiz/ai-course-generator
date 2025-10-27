"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GlobalLoaderProps {
  message?: string
  className?: string
}

export function GlobalLoader({
  message = "Loading...",
  className
}: GlobalLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
        className="text-center space-y-6"
      >
        {/* Neobrutalist loader container */}
        <div className="relative">
          <div className="absolute inset-0 rounded-none bg-yellow-200 border-4 border-black shadow-[4px_4px_0_#000] transform rotate-3" />
          <div className="relative bg-[var(--color-card)] border-4 border-black rounded-none shadow-[4px_4px_0_#000] p-8">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)] mx-auto" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-2"
        >
          <h3 className="text-xl font-bold text-[var(--color-text)]">
            {message}
          </h3>
          <p className="text-sm text-[var(--color-text)]/70">
            Please wait while we prepare your content
          </p>
        </motion.div>

        {/* Animated progress dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-[var(--color-primary)] rounded-full shadow-[2px_2px_0_#000]"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}