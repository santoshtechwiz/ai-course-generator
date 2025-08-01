"use client"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LogIn, RotateCcw, Trophy, Target, Clock, BookOpen, Brain, Zap, Shield, Star } from "lucide-react"
import type { QuizType } from "@/app/types/quiz-types"

interface SignInPromptProps {
  onSignIn: () => void
  onRetake: () => void
  quizType: QuizType
  previewData?: {
    percentage?: number
    score?: number
    maxScore?: number
    correctAnswers?: number
    totalQuestions?: number
    stillLearningAnswers?: number
    incorrectAnswers?: number
  }
}

const quizTypeConfig = {
  mcq: {
    icon: Target,
    title: "Multiple Choice Quiz",
    color: "from-blue-500 to-cyan-500",
    bgColor: "from-blue-50 to-cyan-50",
  },
  openended: {
    icon: BookOpen,
    title: "Open-Ended Quiz",
    color: "from-green-500 to-emerald-500",
    bgColor: "from-green-50 to-emerald-50",
  },
  flashcard: {
    icon: Brain,
    title: "Flashcard Study",
    color: "from-purple-500 to-pink-500",
    bgColor: "from-purple-50 to-pink-50",
  },
  blanks: {
    icon: Zap,
    title: "Fill in the Blanks",
    color: "from-orange-500 to-red-500",
    bgColor: "from-orange-50 to-red-50",
  },
  code: {
    icon: Trophy,
    title: "Code Quiz",
    color: "from-indigo-500 to-purple-500",
    bgColor: "from-indigo-50 to-purple-50",
  },
}

export default function SignInPrompt({ onSignIn, onRetake, quizType, previewData }: SignInPromptProps) {
  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq
  const IconComponent = config.icon

  const renderPreviewStats = () => {
    if (!previewData) return null

    if (quizType === "flashcard") {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{previewData.correctAnswers || 0}</div>
            <div className="text-xs text-green-600 font-medium">Mastered</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{previewData.stillLearningAnswers || 0}</div>
            <div className="text-xs text-yellow-600 font-medium">Learning</div>
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{previewData.percentage || 0}%</div>
          <div className="text-xs text-blue-600 font-medium">Score</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {previewData.score || 0}/{previewData.maxScore || 0}
          </div>
          <div className="text-xs text-green-600 font-medium">Points</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header with gradient background */}
          <div className={`bg-gradient-to-r ${config.color} p-6 text-white relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <motion.div
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <IconComponent className="w-8 h-8" />
              </motion.div>
              <h1 className="text-2xl font-bold text-center mb-2">Quiz Completed!</h1>
              <p className="text-center text-white/90 text-sm">{config.title}</p>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Preview Results */}
            {previewData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-3 flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Your Results Preview
                  </h3>
                </div>
                {renderPreviewStats()}
              </motion.div>
            )}

            <Separator />

            {/* Sign In Benefits */}
            <div className="space-y-4">
              <h3 className="font-semibold text-center flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Sign In to Unlock
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Detailed Results</div>
                    <div className="text-xs text-muted-foreground">View complete analysis & explanations</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Progress Tracking</div>
                    <div className="text-xs text-muted-foreground">Save your quiz history & improvements</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Personalized Learning</div>
                    <div className="text-xs text-muted-foreground">Get recommendations & study plans</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onSignIn}
                  className={`w-full h-12 bg-gradient-to-r ${config.color} hover:opacity-90 text-white font-semibold shadow-lg`}
                  size="lg"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In to View Results
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onRetake}
                  variant="outline"
                  className="w-full h-12 border-2 font-semibold bg-transparent"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Retake Quiz
                </Button>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">Free account • No credit card required</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Instant Access
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Secure
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
