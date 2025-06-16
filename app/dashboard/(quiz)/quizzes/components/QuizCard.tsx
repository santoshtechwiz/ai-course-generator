"use client"

import { useState, memo } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileQuestion, AlignJustify, Code, PenTool, Clock, CheckCircle2, Flashlight, Play, Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AsyncNavLink, EnhancedLoader, useEnhancedLoader } from "@/components/ui/enhanced-loader"

interface QuizCardProps {
  title: string
  description: string
  questionCount: number
  isPublic?: boolean
  slug: string
  quizType: "mcq" | "openended" | "blanks" | "code" | "flashcard"
  estimatedTime: string
  completionRate?: number
}

function QuizCardComponent({
  title,
  description,
  questionCount,
  isPublic = false,
  slug,
  quizType,
  estimatedTime,
  completionRate = 0,
}: QuizCardProps) {  const [isHovered, setIsHovered] = useState(false)
  const { showLoader } = useEnhancedLoader()

  // Enhanced quiz type information with better styling
  const quizTypeInfo = {
    mcq: {
      label: "Multiple Choice",
      icon: FileQuestion,
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      textColor: "text-blue-700 dark:text-blue-300",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    openended: {
      label: "Open Ended",
      icon: AlignJustify,
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      textColor: "text-green-700 dark:text-green-300",
      borderColor: "border-green-200 dark:border-green-800",
    },
    code: {
      label: "Code Challenge",
      icon: Code,
      gradient: "from-purple-500 to-violet-500",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
      textColor: "text-purple-700 dark:text-purple-300",
      borderColor: "border-purple-200 dark:border-purple-800",
    },
    blanks: {
      label: "Fill in the Blanks",
      icon: PenTool,
      gradient: "from-yellow-500 to-orange-500",
      bgColor: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
      textColor: "text-yellow-700 dark:text-yellow-300",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    flashcard: {
      label: "Flash Cards",
      icon: Flashlight,
      gradient: "from-pink-500 to-rose-500",
      bgColor: "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20",
      textColor: "text-pink-700 dark:text-pink-300",
      borderColor: "border-pink-200 dark:border-pink-800",
    },
  }

  const {
    label,
    icon: Icon,
    gradient,
    bgColor,
    textColor,
    borderColor,
  } = quizTypeInfo[quizType] || {
    label: "Quiz",
    icon: FileQuestion,
    gradient: "from-gray-500 to-slate-500",
    bgColor: "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20",
    textColor: "text-gray-700 dark:text-gray-300",
    borderColor: "border-gray-200 dark:border-gray-800",
  }
  // No longer needed as AsyncNavLink will handle loading automatically

  // Determine button text and icon based on completion
  const getButtonContent = () => {
    if (completionRate >= 100) {
      return {
        text: "Review Quiz",
        icon: Eye,
        variant: "outline" as const,
      }
    } else if (completionRate > 0) {
      return {
        text: "Continue Quiz",
        icon: Play,
        variant: "default" as const,
      }
    } else {
      return {
        text: "Start Quiz",
        icon: Play,
        variant: "default" as const,
      }
    }
  }

  const buttonContent = getButtonContent()
  const ButtonIcon = buttonContent.icon
  // Enhanced loader is now handled automatically by AsyncNavLink

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", type: "spring", stiffness: 100, damping: 15 }}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card className="h-full overflow-hidden flex flex-col bg-gradient-to-br from-background via-background to-muted/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Enhanced Header */}
        <CardHeader className="p-5 pb-3 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
          </div>

          <div className="relative z-10 space-y-3">
            {/* Badges Row */}
            <div className="flex justify-between items-start">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${bgColor} ${textColor} ${borderColor} shadow-sm`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{label}</span>
              </motion.div>

              <AnimatePresence>
                {isPublic && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <Badge variant="secondary" className="text-xs font-medium">
                      Public
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Completion Badge */}
            <AnimatePresence>
              {completionRate >= 100 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, x: 20 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute top-3 right-3"
                >
                  <motion.div
                    className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/20"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        {/* Enhanced Content */}
        <CardContent className="p-5 pt-2 flex-grow space-y-4">
          {/* Title and Description */}
          <div className="space-y-2">
            <motion.h3
              className="font-bold text-lg leading-tight text-foreground line-clamp-2 hover:text-primary transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
            >
              {title}
            </motion.h3>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{description}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              className="bg-muted/40 backdrop-blur-sm p-3 rounded-xl border border-border/50 text-center"
              whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--muted), 0.6)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-foreground">{questionCount}</div>
              <div className="text-xs text-muted-foreground font-medium">Questions</div>
            </motion.div>

            <motion.div
              className="bg-muted/40 backdrop-blur-sm p-3 rounded-xl border border-border/50 text-center"
              whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--muted), 0.6)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-lg font-bold text-foreground">{estimatedTime}</span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">Estimated</div>
            </motion.div>
          </div>

          {/* Progress Section */}
          <AnimatePresence>
            {completionRate > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Progress</span>
                  <span className={`font-bold ${completionRate >= 100 ? "text-green-600" : "text-primary"}`}>
                    {Math.round(completionRate)}%
                  </span>
                </div>
                <div className="relative">
                  <Progress value={completionRate} className="h-2 bg-muted/50" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>        {/* Enhanced Footer */}
        <CardFooter className="p-5 pt-3 mt-auto">
          <AsyncNavLink 
            href={`/dashboard/${quizType}/${slug}`} 
            className="w-full"
            loaderOptions={{
              variant: "shimmer",
              message: "Loading quiz...",
              fullscreen: true
            }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button
                variant={buttonContent.variant}
                className={`
                  w-full h-11 font-medium transition-all duration-300
                  ${
                    buttonContent.variant === "default"
                      ? `bg-gradient-to-r ${gradient} hover:shadow-lg hover:shadow-primary/25 text-white border-0`
                      : "hover:bg-muted/50"
                  }
                `}
              >
                <motion.div className="flex items-center gap-2" whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
                  <ButtonIcon className="w-4 h-4" />
                  {buttonContent.text}
                </motion.div>
              </Button>
            </motion.div>
          </AsyncNavLink>
        </CardFooter>

        {/* Hover Glow Effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 rounded-lg`} />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const QuizCard = memo(QuizCardComponent)
