"use client"

import { motion } from "framer-motion"
import { Timer, Code, AlignLeft } from "lucide-react"
import { Card } from "@/components/ui/card"

interface QuizSubmissionLoadingProps {
  quizType?: "code" | "blanks" | "quiz"
}

export function QuizSubmissionLoading({ quizType = "quiz" }: QuizSubmissionLoadingProps) {
  const LoadingIcon = {
    code: Code,
    blanks: AlignLeft,
    quiz: Timer,
  }[quizType]

  return (
    <Card className="max-w-3xl mx-auto p-8">
      <div className="flex flex-col items-center justify-center gap-6">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-primary/10 p-4 rounded-full"
        >
          <LoadingIcon className="w-8 h-8 text-primary" />
        </motion.div>

        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-primary">Submitting Your Quiz</h2>
          <p className="text-muted-foreground">Please wait while we process your answers...</p>
        </div>

        <div className="w-full max-w-xs">
          <motion.div
            className="h-2 bg-primary/20 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="h-full bg-primary"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                repeat: Infinity,
                duration: 1,
                ease: "linear",
              }}
            />
          </motion.div>
        </div>
      </div>
    </Card>
  )
}
