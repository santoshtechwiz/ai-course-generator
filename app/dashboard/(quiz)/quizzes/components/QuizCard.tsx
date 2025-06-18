"use client"

import { useState, memo } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  FileQuestion,
  AlignJustify,
  Code,
  PenTool,
  Clock,
  Flashlight,
  Play,
  Eye,
  Users,
  Trophy,
  Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AsyncNavLink } from "@/components/ui/enhanced-loader"

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
}: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Enhanced quiz type information with modern styling
  const quizTypeInfo = {
    mcq: {
      label: "Multiple Choice",
      icon: FileQuestion,
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
      textColor: "text-blue-700 dark:text-blue-300",
      borderColor: "border-blue-200/60 dark:border-blue-800/60",
      accentColor: "text-blue-600 dark:text-blue-400",
    },
    openended: {
      label: "Open Ended",
      icon: AlignJustify,
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
      textColor: "text-green-700 dark:text-green-300",
      borderColor: "border-green-200/60 dark:border-green-800/60",
      accentColor: "text-green-600 dark:text-green-400",
    },
    code: {
      label: "Code Challenge",
      icon: Code,
      gradient: "from-purple-500 to-violet-500",
      bgColor: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30",
      textColor: "text-purple-700 dark:text-purple-300",
      borderColor: "border-purple-200/60 dark:border-purple-800/60",
      accentColor: "text-purple-600 dark:text-purple-400",
    },
    blanks: {
      label: "Fill in the Blanks",
      icon: PenTool,
      gradient: "from-amber-500 to-orange-500",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
      textColor: "text-amber-700 dark:text-amber-300",
      borderColor: "border-amber-200/60 dark:border-amber-800/60",
      accentColor: "text-amber-600 dark:text-amber-400",
    },
    flashcard: {
      label: "Flash Cards",
      icon: Flashlight,
      gradient: "from-pink-500 to-rose-500",
      bgColor: "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30",
      textColor: "text-pink-700 dark:text-pink-300",
      borderColor: "border-pink-200/60 dark:border-pink-800/60",
      accentColor: "text-pink-600 dark:text-pink-400",
    },
  }

  const {
    label,
    icon: Icon,
    gradient,
    bgColor,
    textColor,
    borderColor,
    accentColor,
  } = quizTypeInfo[quizType] || quizTypeInfo.mcq

  // Determine button content based on completion
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        type: "spring",
        stiffness: 120,
        damping: 20,
      }}
      whileHover={{
        y: -6,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full"
    >
      <Card className="h-full overflow-hidden flex flex-col bg-gradient-to-br from-background via-background to-muted/10 border border-border/50 shadow-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
        {/* Enhanced Header with Floating Elements */}
        <CardHeader className="p-5 pb-3 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <motion.div
            className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500"
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
          </motion.div>

          <div className="relative z-10 space-y-3">
            {/* Top Row - Type Badge and Status */}
            <div className="flex justify-between items-start">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${bgColor} ${textColor} ${borderColor} shadow-sm backdrop-blur-sm`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{label}</span>
              </motion.div>

              <div className="flex items-center gap-2">
                {/* Public Badge */}
                <AnimatePresence>
                  {isPublic && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <Badge variant="secondary" className="text-xs font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Public
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Completion Badge */}
                <AnimatePresence>
                  {completionRate >= 100 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <motion.div
                        className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trophy className="w-4 h-4 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Enhanced Content */}
        <CardContent className="p-5 pt-2 flex-grow space-y-4">
          {/* Title and Description */}
          <div className="space-y-2">
            <motion.h3
              className="font-bold text-lg leading-tight text-foreground line-clamp-2 hover:text-primary transition-colors duration-200 cursor-default"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.h3>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{description}</p>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              className="bg-gradient-to-br from-muted/40 to-muted/20 backdrop-blur-sm p-3 rounded-xl border border-border/30 text-center group/stat"
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(var(--muted), 0.6)",
                borderColor: "rgba(var(--primary), 0.2)",
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileQuestion
                  className={`w-4 h-4 ${accentColor} group-hover/stat:scale-110 transition-transform duration-200`}
                />
                <span className="text-2xl font-bold text-foreground">{questionCount}</span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">Questions</div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-muted/40 to-muted/20 backdrop-blur-sm p-3 rounded-xl border border-border/30 text-center group/stat"
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(var(--muted), 0.6)",
                borderColor: "rgba(var(--primary), 0.2)",
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock
                  className={`w-4 h-4 ${accentColor} group-hover/stat:scale-110 transition-transform duration-200`}
                />
                <span className="text-lg font-bold text-foreground">{estimatedTime}</span>
              </div>
              <div className="text-xs text-muted-foreground font-medium">Estimated</div>
            </motion.div>
          </div>

          {/* Enhanced Progress Section */}
          <AnimatePresence>
            {completionRate > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Progress
                  </span>
                  <motion.span
                    className={`font-bold ${completionRate >= 100 ? "text-green-600" : accentColor}`}
                    key={completionRate}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {Math.round(completionRate)}%
                  </motion.span>
                </div>
                <div className="relative">
                  <Progress value={completionRate} className="h-2 bg-muted/50" />
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        exit={{ x: "100%" }}
                        transition={{
                          duration: 1.5,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* Enhanced Footer */}
        <CardFooter className="p-5 pt-3 mt-auto">
          <AsyncNavLink
            href={`/dashboard/${quizType}/${slug}`}
            className="w-full"
            loaderOptions={{
              variant: "shimmer",
              message: "Loading quiz...",
              subMessage: "Preparing your questions",
              fullscreen: true,
              showLogo: true,
            }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button
                variant={buttonContent.variant}
                className={`
                  w-full h-11 font-medium transition-all duration-300 relative overflow-hidden
                  ${
                    buttonContent.variant === "default"
                      ? `bg-gradient-to-r ${gradient} hover:shadow-lg hover:shadow-primary/25 text-white border-0`
                      : "hover:bg-muted/50 border-border/50"
                  }
                `}
              >
                <motion.div
                  className="flex items-center gap-2 relative z-10"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  <ButtonIcon className="w-4 h-4" />
                  {buttonContent.text}
                </motion.div>

                {/* Button Shimmer Effect */}
                {buttonContent.variant === "default" && (
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
                )}
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
              className="absolute inset-0 pointer-events-none rounded-lg"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] rounded-lg`} />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent rounded-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const QuizCard = memo(QuizCardComponent)
