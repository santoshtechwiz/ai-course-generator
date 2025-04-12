"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Lock,
  Unlock,
  ArrowRight,
  Award,
  FileQuestion,
  AlignJustify,
  PenTool,
  Code,
  Flashlight,
  Brain,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { buildQuizUrl } from "@/lib/utils"

interface QuizCardProps {
  title: string
  description: string
  questionCount: number
  isPublic: boolean
  slug: string
  quizType: "mcq" | "openended" | "fill-blanks" | "code" | "flashcard"
  estimatedTime: string
  completionRate: number
}

// Quiz type configuration with enhanced visual elements
const quizTypeConfig = {
  mcq: {
    label: "Multiple Choice",
    color: "from-blue-500 to-indigo-600",
    lightColor: "bg-blue-50 text-blue-800 border-blue-200",
    icon: FileQuestion,
    illustration: (props) => <MCQIllustration {...props} />,
    gradient: "from-blue-50 via-indigo-50 to-blue-50",
  },
  openended: {
    label: "Open Ended",
    color: "from-emerald-500 to-green-600",
    lightColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    icon: AlignJustify,
    illustration: (props) => <OpenEndedIllustration {...props} />,
    gradient: "from-emerald-50 via-green-50 to-emerald-50",
  },
  "fill-blanks": {
    label: "Fill in Blanks",
    color: "from-amber-500 to-yellow-600",
    lightColor: "bg-amber-50 text-amber-800 border-amber-200",
    icon: PenTool,
    illustration: (props) => <FillBlanksIllustration {...props} />,
    gradient: "from-amber-50 via-yellow-50 to-amber-50",
  },
  code: {
    label: "Code Challenge",
    color: "from-purple-500 to-violet-600",
    lightColor: "bg-purple-50 text-purple-800 border-purple-200",
    icon: Code,
    illustration: (props) => <CodeIllustration {...props} />,
    gradient: "from-purple-50 via-violet-50 to-purple-50",
  },
  flashcard: {
    label: "Flash Card",
    color: "from-pink-500 to-rose-600",
    lightColor: "bg-pink-50 text-pink-800 border-pink-200",
    icon: Flashlight,
    illustration: (props: React.JSX.IntrinsicAttributes & { isHovered: boolean }) => <FlashcardIllustration {...props} />,
    gradient: "from-pink-50 via-rose-50 to-pink-50",
  },
}

export function QuizCard({
  title,
  description,
  questionCount,
  isPublic,
  slug,
  quizType,
  estimatedTime,
  completionRate,
}: QuizCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Mouse parallax effect values
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 300 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  // Transform values for parallax effect
  const illustrationX = useTransform(springX, [-100, 100], [10, -10])
  const illustrationY = useTransform(springY, [-100, 100], [10, -10])
  const shadowX = useTransform(springX, [-100, 100], [-5, 5])
  const shadowY = useTransform(springY, [-100, 100], [-5, 5])
  const shadowBlur = useTransform(springX, [-100, 100], [8, 16])

  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq
  const TypeIcon = config.icon
  const Illustration = config.illustration

  // Handle mouse move for parallax effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  // Reset mouse position when not hovering
  const handleMouseLeave = () => {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  // Intersection observer to trigger entrance animation
  useEffect(() => {
    if (!cardRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1,
      }}
      whileHover={{
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 15 },
      }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="h-full perspective"
    >
      <Card className="overflow-hidden w-full h-full border-0 shadow-lg relative bg-white dark:bg-gray-900">
        {/* Animated gradient background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`}
          animate={{
            opacity: isHovered ? 0.8 : 0.5,
            backgroundSize: isHovered ? "200% 200%" : "100% 100%",
          }}
          transition={{ duration: 0.6 }}
        />

        {/* Card shadow with parallax effect */}
        <motion.div
          className="absolute -inset-px rounded-lg opacity-0"
          style={{
            boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.1)`,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        />

        <CardContent className="flex flex-col h-full p-6 relative z-10">
          {/* Top section with badge and illustration */}
          <div className="flex justify-between items-start mb-4">
            <Badge
              className={`px-3 py-1.5 font-medium text-xs ${config.lightColor} flex items-center gap-1.5 shadow-sm`}
            >
              <TypeIcon className="w-3.5 h-3.5" />
              {config.label}
            </Badge>

            {/* Public/Private Badge */}
            <motion.div
              initial={{ opacity: 0.8, y: 5 }}
              animate={{ opacity: isHovered ? 1 : 0.8, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Badge
                variant="outline"
                className={`px-2 py-1 text-xs flex items-center gap-1 ${
                  isPublic
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isPublic ? (
                  <>
                    <Unlock className="w-3 h-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    Private
                  </>
                )}
              </Badge>
            </motion.div>
          </div>

          {/* Illustration with parallax effect */}
          <motion.div
            className="h-32 mb-4 flex items-center justify-center overflow-hidden"
            style={{
              x: illustrationX,
              y: illustrationY,
            }}
          >
            <Illustration isHovered={isHovered} />
          </motion.div>

          {/* Title with animated underline on hover */}
          <div className="mb-2 relative">
            <h3 className="text-lg font-bold line-clamp-2 transition-colors duration-300 group-hover:text-primary">
              {title}
            </h3>
            <motion.div
              className={`h-0.5 bg-gradient-to-r ${config.color} rounded-full`}
              initial={{ width: "0%" }}
              animate={{ width: isHovered ? "100%" : "0%" }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          </div>

          {/* Stats Grid with animated icons */}
          <div className="grid grid-cols-2 gap-3 text-sm my-4">
            <motion.div
              className="flex items-center justify-center bg-muted/50 rounded-lg p-2.5 transition-colors duration-300 hover:bg-muted"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: isHovered ? [0, -10, 10, -5, 5, 0] : 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
              >
                <Brain className="w-4 h-4 mr-2 text-primary/70" />
              </motion.div>
              <div className="text-center">
                <span className="font-semibold block">{questionCount}</span>
                <span className="text-xs text-muted-foreground">Questions</span>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center justify-center bg-muted/50 rounded-lg p-2.5 transition-colors duration-300 hover:bg-muted"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: isHovered ? [0, 15, 0] : 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
              >
                <Clock className="w-4 h-4 mr-2 text-primary/70" />
              </motion.div>
              <div className="text-center">
                <span className="font-semibold block">{estimatedTime}</span>
                <span className="text-xs text-muted-foreground">Est. Time</span>
              </div>
            </motion.div>
          </div>

          {/* Completion Rate with animated progress */}
          <div className="mb-6 mt-auto">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-muted-foreground flex items-center">
                <Award className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Best Score
              </span>
              <motion.span
                className="text-xs font-medium"
                animate={{
                  scale: isHovered && completionRate > 0 ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {completionRate}%
              </motion.span>
            </div>
            <Progress
              value={completionRate}
              className="h-1.5 bg-muted"
              indicatorClassName={`${
                completionRate > 0 ? `bg-gradient-to-r ${config.color}` : "bg-muted-foreground/20"
              }`}
            />
          </div>

          {/* Start Quiz Button with animated effects */}
          <Link href={`${buildQuizUrl(slug,quizType)}`} className="block w-full">
            <Button className="w-full group relative overflow-hidden" variant={isHovered ? "default" : "outline"}>
              <AnimatePresence mode="wait">
                {isHovered ? (
                  <motion.span
                    className="flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    Start Quiz
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "mirror",
                        duration: 1,
                        repeatDelay: 0.5,
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </motion.span>
                ) : (
                  <motion.span
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    View Quiz
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Animated background gradient on hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${config.color}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ zIndex: -1 }}
              />
            </Button>
          </Link>

          {/* Sparkle effect on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="absolute top-1/2 right-6 text-yellow-400 dark:text-yellow-300"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// SVG Illustrations for each quiz type
function MCQIllustration({ isHovered }: { isHovered: boolean }) {
  return (
    <motion.svg
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0.8 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      <motion.rect
        x="10"
        y="15"
        width="100"
        height="10"
        rx="5"
        fill="#3B82F6"
        initial={{ width: 0 }}
        animate={{ width: 100 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      <motion.rect
        x="20"
        y="35"
        width="80"
        height="8"
        rx="4"
        fill="#93C5FD"
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      <motion.circle
        cx="15"
        cy="55"
        r="5"
        fill="#2563EB"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      <motion.rect
        x="25"
        y="51"
        width="60"
        height="8"
        rx="4"
        fill="#BFDBFE"
        initial={{ width: 0 }}
        animate={{ width: 60 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
      <motion.circle
        cx="15"
        cy="70"
        r="5"
        fill="#2563EB"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
      <motion.rect
        x="25"
        y="66"
        width="70"
        height="8"
        rx="4"
        fill="#BFDBFE"
        initial={{ width: 0 }}
        animate={{ width: 70 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
    </motion.svg>
  )
}

function OpenEndedIllustration({ isHovered }: { isHovered: boolean }) {
  return (
    <motion.svg
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0.8 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      <motion.rect
        x="10"
        y="10"
        width="100"
        height="10"
        rx="5"
        fill="#10B981"
        initial={{ width: 0 }}
        animate={{ width: 100 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      <motion.rect
        x="10"
        y="30"
        width="100"
        height="40"
        rx="5"
        fill="#D1FAE5"
        stroke="#10B981"
        strokeWidth="2"
        initial={{ height: 0 }}
        animate={{ height: 40 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <motion.path
        d="M20 35 L30 35 L40 35"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      <motion.path
        d="M20 45 L50 45 L60 45"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      />
      <motion.path
        d="M20 55 L40 55"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      />
    </motion.svg>
  )
}

function FillBlanksIllustration({ isHovered }: { isHovered: boolean }) {
  return (
    <motion.svg
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0.8 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      <motion.rect
        x="10"
        y="15"
        width="100"
        height="10"
        rx="5"
        fill="#F59E0B"
        initial={{ width: 0 }}
        animate={{ width: 100 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      <motion.rect
        x="10"
        y="35"
        width="20"
        height="8"
        rx="4"
        fill="#FCD34D"
        initial={{ width: 0 }}
        animate={{ width: 20 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
      <motion.rect
        x="35"
        y="35"
        width="30"
        height="8"
        rx="4"
        fill="#FCD34D"
        initial={{ width: 0 }}
        animate={{ width: 30 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      <motion.rect
        x="70"
        y="35"
        width="40"
        height="8"
        rx="4"
        fill="#FCD34D"
        initial={{ width: 0 }}
        animate={{ width: 40 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
      <motion.rect
        x="35"
        y="55"
        width="50"
        height="10"
        rx="2"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeDasharray="4 4"
        fill="#FEF3C7"
        initial={{ width: 0 }}
        animate={{ width: 50 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
    </motion.svg>
  )
}

function CodeIllustration({ isHovered }: { isHovered: boolean }) {
  return (
    <motion.svg
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0.8 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      <motion.rect
        x="10"
        y="10"
        width="100"
        height="60"
        rx="5"
        fill="#F3F4F6"
        stroke="#8B5CF6"
        strokeWidth="2"
        initial={{ height: 0 }}
        animate={{ height: 60 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
      <motion.path
        d="M30 30 L20 40 L30 50"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <motion.path
        d="M50 30 L60 40 L50 50"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      />
      <motion.path
        d="M45 25 L35 55"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      <motion.rect
        x="70"
        y="25"
        width="30"
        height="8"
        rx="4"
        fill="#C4B5FD"
        initial={{ width: 0 }}
        animate={{ width: 30 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      />
      <motion.rect
        x="70"
        y="40"
        width="20"
        height="8"
        rx="4"
        fill="#C4B5FD"
        initial={{ width: 0 }}
        animate={{ width: 20 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      />
    </motion.svg>
  )
}

function FlashcardIllustration({ isHovered }: { isHovered: boolean }) {
  return (
    <motion.svg
      width="120"
      height="80"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0.8 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.05 : 1,
        rotateY: isHovered ? [0, 180, 0] : 0,
      }}
      transition={{
        duration: 0.8,
        rotateY: { duration: 1.2, delay: 0.2 },
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.rect
        x="20"
        y="10"
        width="80"
        height="60"
        rx="5"
        fill="#FBCFE8"
        stroke="#EC4899"
        strokeWidth="2"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.rect
        x="35"
        y="20"
        width="50"
        height="8"
        rx="4"
        fill="#EC4899"
        initial={{ width: 0 }}
        animate={{ width: 50 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      <motion.rect
        x="45"
        y="35"
        width="30"
        height="8"
        rx="4"
        fill="#F472B6"
        initial={{ width: 0 }}
        animate={{ width: 30 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      <motion.circle
        cx="60"
        cy="55"
        r="5"
        fill="#EC4899"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
    </motion.svg>
  )
}

// Add perspective to parent container
const styles = `
.perspective {
  perspective: 1000px;
}
`

// Add global styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style")
  styleElement.innerHTML = styles
  document.head.appendChild(styleElement)
}
