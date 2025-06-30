"use client"

import type { QuizType } from "@/app/types/quiz-types"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  BookOpen,
  LogIn,
  RefreshCw,
  ListChecks,
  Code2,
  FileText,
  Trophy,
  Star,
  TrendingUp,
  Users,
  Crown,
  Gift,
  Zap,
  Target,
  Award,
  ChevronRight,
  Heart,
  Shield,
  Rocket,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"

// Enhanced quiz type metadata with business-focused messaging
const quizTypeMeta: Record<
  QuizType,
  {
    icon: typeof ListChecks
    title: string
    feedback: string
    businessValue: string
    color: string
    gradient: string
  }
> = {
  mcq: {
    icon: ListChecks,
    title: "Knowledge Mastered!",
    feedback: "Unlock detailed analytics and performance insights",
    businessValue: "Track your learning journey with advanced metrics",
    color: "text-blue-600",
    gradient: "from-blue-500 to-cyan-500",
  },
  code: {
    icon: Code2,
    title: "Code Skills Elevated!",
    feedback: "Access premium code analysis and improvement tips",
    businessValue: "Accelerate your programming career with expert feedback",
    color: "text-green-600",
    gradient: "from-green-500 to-emerald-500",
  },
  blanks: {
    icon: FileText,
    title: "Comprehension Complete!",
    feedback: "Get personalized learning recommendations",
    businessValue: "Build stronger foundations with targeted practice",
    color: "text-purple-600",
    gradient: "from-purple-500 to-pink-500",
  },
  openended: {
    icon: BookOpen,
    title: "Critical Thinking Unlocked!",
    feedback: "Receive AI-powered writing analysis and suggestions",
    businessValue: "Enhance your communication skills with expert insights",
    color: "text-orange-600",
    gradient: "from-orange-500 to-red-500",
  },
  flashcard: {
    icon: BookOpen,
    title: "Memory Palace Built!",
    feedback: "Access spaced repetition and retention analytics",
    businessValue: "Maximize retention with scientifically-proven methods",
    color: "text-indigo-600",
    gradient: "from-indigo-500 to-purple-500",
  },
}

const getQuizMeta = (quizType: QuizType = "flashcard") => quizTypeMeta[quizType] || quizTypeMeta.flashcard

// Floating particles animation component
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Premium features showcase
const PremiumFeatures = ({ quizType }: { quizType: QuizType }) => {
  const features = [
    { icon: Trophy, text: "Detailed Performance Analytics", premium: true },
    { icon: TrendingUp, text: "Progress Tracking & Insights", premium: true },
    { icon: Target, text: "Personalized Learning Path", premium: true },
    { icon: Award, text: "Achievement Certificates", premium: true },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <Crown className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-semibold text-muted-foreground">Premium Features</span>
        <Crown className="w-4 h-4 text-yellow-500" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20"
          >
            <feature.icon className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-foreground">{feature.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Social proof component
const SocialProof = () => {
  const stats = [
    { icon: Users, value: "50K+", label: "Active Learners" },
    { icon: Star, value: "4.9", label: "Rating" },
    { icon: Trophy, value: "1M+", label: "Quizzes Completed" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="flex justify-center gap-6 py-4 border-t border-border/50"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 + index * 0.1, type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <stat.icon className="w-3 h-3 text-primary" />
            <span className="text-sm font-bold text-foreground">{stat.value}</span>
          </div>
          <span className="text-xs text-muted-foreground">{stat.label}</span>
        </motion.div>
      ))}
    </motion.div>
  )
}

// Enhanced Sign-In Prompt Component
const SignInPrompt = ({
  onSignIn,
  onRetake,
  quizType = "flashcard",
  previewData,
  isLoading = false,
}: {
  onSignIn: () => void
  onRetake: () => void
  quizType?: QuizType
  previewData?: {
    percentage?: number
    score?: number
    maxScore?: number
    correctAnswers?: number
    totalQuestions?: number
    stillLearningAnswers?: number
    incorrectAnswers?: number
  }
  isLoading?: boolean
}) => {
  const meta = getQuizMeta(quizType)
  const Icon = meta.icon
  const showScore = previewData && (previewData.score !== undefined || previewData.correctAnswers !== undefined)

  const correct = previewData?.correctAnswers ?? previewData?.score ?? 0
  const total = previewData?.totalQuestions ?? previewData?.maxScore ?? 0
  const percentage = previewData?.percentage ?? (total > 0 ? Math.round((correct / total) * 100) : 0)

  // Performance level with enhanced messaging
  const getPerformanceLevel = (score: number) => {
    if (score >= 90)
      return { level: "Exceptional", emoji: "🏆", color: "text-yellow-600", message: "Outstanding mastery!" }
    if (score >= 80) return { level: "Excellent", emoji: "⭐", color: "text-green-600", message: "Great job!" }
    if (score >= 70) return { level: "Good", emoji: "👍", color: "text-blue-600", message: "Well done!" }
    if (score >= 60) return { level: "Fair", emoji: "📈", color: "text-orange-600", message: "Keep improving!" }
    return { level: "Needs Work", emoji: "💪", color: "text-red-600", message: "Practice makes perfect!" }
  }

  const performance = getPerformanceLevel(percentage)

  // Skeleton loading UI with enhanced animations
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto w-full px-4 sm:px-0">
        <Card className="shadow-2xl border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
          <CardHeader className="text-center pb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-20 h-20 bg-gradient-to-r from-primary/20 to-primary/30 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
            </motion.div>
            <Skeleton className="h-8 w-2/3 mx-auto mb-2" />
            <div className="mt-6 p-6 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl">
              <Skeleton className="h-8 w-1/3 mx-auto mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-lg mx-auto w-full px-4 sm:px-0"
    >
      <Card className="shadow-2xl border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden relative">
        <FloatingParticles />

        {/* Header with enhanced animations */}
        <CardHeader className="text-center pb-6 relative">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
            className={`w-20 h-20 bg-gradient-to-r ${meta.gradient} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg relative`}
          >
            <Icon className="w-10 h-10 text-white" />
            <motion.div
              className="absolute inset-0 rounded-full bg-white/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <CardTitle className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {meta.title}
            </CardTitle>
            <p className={`text-sm font-semibold ${meta.color} mb-4`}>{meta.businessValue}</p>
          </motion.div>

          {/* Enhanced Score Display */}
          {showScore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
              className="mt-6 p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 backdrop-blur-sm relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />

              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                  className="flex items-center justify-center gap-3 mb-4"
                >
                  <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {correct}/{total}
                  </span>
                  <Badge className={`${performance.color} bg-transparent border-current`}>
                    {performance.emoji} {performance.level}
                  </Badge>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm text-muted-foreground mb-4 font-medium"
                >
                  {performance.message}
                </motion.p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {quizType === "flashcard" ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="flex justify-between items-center p-2 rounded-lg bg-green-500/10"
                      >
                        <span className="text-muted-foreground">Mastered:</span>
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {previewData?.correctAnswers || 0}
                        </span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.0 }}
                        className="flex justify-between items-center p-2 rounded-lg bg-amber-500/10"
                      >
                        <span className="text-muted-foreground">Learning:</span>
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {previewData?.stillLearningAnswers || 0}
                        </span>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="flex justify-between items-center p-2 rounded-lg bg-primary/10"
                      >
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-bold text-primary">{percentage}%</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.0 }}
                        className="flex justify-between items-center p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`font-bold ${performance.color}`}>
                          {percentage >= 70 ? "Passed" : "Retry"}
                        </span>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </CardHeader>

        <CardContent className="text-center pb-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="space-y-3"
          >
            <p className="text-muted-foreground font-medium text-base">{meta.feedback}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Gift className="w-4 h-4 text-primary" />
              <span>Join thousands of learners advancing their skills</span>
            </div>
          </motion.div>

          <PremiumFeatures quizType={quizType} />

          {/* Enhanced Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="space-y-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onSignIn}
                size="lg"
                className="w-full gap-3 h-14 text-base font-semibold bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-1 bg-white/20 rounded-full">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <span>Unlock Full Results</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onRetake}
                variant="outline"
                size="lg"
                className="w-full gap-3 h-12 text-base font-semibold border-2 hover:bg-muted/50 transition-all duration-300 group bg-transparent"
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                <span>Try Again</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4"
          >
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-500" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-500" />
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-1">
              <Rocket className="w-3 h-3 text-blue-500" />
              <span>Instant Access</span>
            </div>
          </motion.div>
        </CardContent>

        <CardFooter className="bg-gradient-to-r from-muted/30 to-muted/50 border-t border-border/50 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <SocialProof />
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default SignInPrompt
