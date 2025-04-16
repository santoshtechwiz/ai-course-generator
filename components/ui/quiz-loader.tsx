"use client"

import React from "react"
import { motion } from "framer-motion"
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"

interface QuizLoaderProps {
  message?: string
  subMessage?: string
  size?: "sm" | "md" | "lg"
}

export const QuizLoader: React.FC<QuizLoaderProps> = ({
  message = "Loading...",
  subMessage,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <Card className="w-full max-w-3xl mx-auto my-8 border border-border/50 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
          className="mb-4"
        >
          <Loader2 className={`text-primary ${sizeClasses[size]}`} />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-medium text-foreground mb-2"
        >
          {message}
        </motion.h3>
        {subMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground text-center max-w-md"
          >
            {subMessage}
          </motion.p>
        )}
      </CardContent>
    </Card>
  )
}
