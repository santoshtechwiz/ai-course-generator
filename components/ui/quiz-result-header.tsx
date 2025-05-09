"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Award } from "lucide-react"

interface QuizResultHeaderProps {
  title: string
  completedAt: string
  score: number
  feedbackMessage: string
  icon?: React.ReactNode
  scoreLabel?: string
}

export function QuizResultHeader({
  title,
  completedAt,
  score,
  feedbackMessage,
  icon,
  scoreLabel = "Score",
}: QuizResultHeaderProps) {
  return (
    <Card>
      <CardHeader className="pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <div className="flex items-center mb-2">
            {icon || <Award className="h-6 w-6 text-primary mr-2" />}
            <CardTitle className="text-2xl">{title}</CardTitle>
          </div>

          <CardDescription className="mb-4">Completed on {new Date(completedAt).toLocaleDateString()}</CardDescription>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="bg-primary/10 px-4 py-2 rounded-full text-primary font-medium mb-3"
          >
            {scoreLabel}: {score}%
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-muted-foreground max-w-md"
          >
            {feedbackMessage}
          </motion.p>
        </motion.div>
      </CardHeader>
    </Card>
  )
}
