"use client"

import { useState, useEffect } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Clock, Star, Zap, ArrowRight, HelpCircle, Brain, Timer, Trophy } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { QuizCardProps } from "@/app/types"

const QuizCard: React.FC<QuizCardProps> = ({
  title,
  questionCount,
  isTrending,
  slug,
  quizType,
  estimatedTime = "5 min",
  description,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      scale: [1, 1.02, 1],
      transition: { duration: 4, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
    })
  }, [controls])

  const svgVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    hover: {
      scale: 1.1,
      transition: { duration: 0.3 },
    },
  }

  const pathVariants = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: { duration: 1.5, ease: "easeInOut" },
    },
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-sm mx-auto"
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300",
          "hover:shadow-md hover:border-primary/20",
          "dark:bg-card dark:text-card-foreground",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="relative p-6 pb-0">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"
            animate={
              isHovered
                ? { opacity: 1, backgroundImage: "linear-gradient(to bottom right, var(--primary), var(--secondary))" }
                : { opacity: 0.8 }
            }
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="relative z-10 mb-4 mx-auto"
            variants={svgVariants}
            initial="hidden"
            animate={isHovered ? "hover" : "visible"}
          >
            <div className="size-20 mx-auto bg-background/10 rounded-xl backdrop-blur-sm flex items-center justify-center">
              <motion.svg viewBox="0 0 50 50" className="size-12 text-primary" xmlns="http://www.w3.org/2000/svg">
                {quizType === "mcq" ? (
                  <>
                    <motion.path
                      d="M25 10 C15 10 10 20 10 25 C10 30 15 40 25 40 C35 40 40 30 40 25 C40 20 35 10 25 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      variants={pathVariants}
                    />
                    <motion.path
                      d="M20 25 H30 M25 20 V30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      variants={pathVariants}
                    />
                  </>
                ) : (
                  <>
                    <motion.circle
                      cx="25"
                      cy="25"
                      r="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      variants={pathVariants}
                    />
                    <motion.path
                      d="M25 15 L25 25 L35 25"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      variants={pathVariants}
                    />
                  </>
                )}
              </motion.svg>
            </div>
          </motion.div>

          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <Badge variant="secondary" className="font-medium">
              {quizType.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="font-medium">
              <Clock className="size-3 mr-1" />
              {estimatedTime}
            </Badge>
            {isTrending && (
              <Badge variant="destructive" className="font-medium">
                <Star className="size-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>

          <CardTitle className="text-2xl font-bold text-center relative z-10">{title}</CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
              <HelpCircle className="size-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{questionCount} Questions</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
              <Trophy className="size-4 mr-2 text-yellow-500" />
              <span className="text-muted-foreground">Earn Points</span>
            </motion.div>
          </div>
          <CardDescription className="text-center">{description}</CardDescription>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button
            className="w-full group relative overflow-hidden"
            size="lg"
            onClick={() => router.push(`/dashboard/${quizType === "mcq" ? "mcq" : "openended"}/${slug}`)}
          >
            <motion.span
              initial={{ x: 0 }}
              animate={isHovered ? { x: -10 } : { x: 0 }}
              className="relative z-10 flex items-center justify-center gap-2"
            >
              Start Quiz
              <motion.span
                initial={{ x: -10, opacity: 0 }}
                animate={isHovered ? { x: 0, opacity: 1 } : { x: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="size-4" />
              </motion.span>
            </motion.span>
            <motion.div
              className="absolute inset-0 bg-primary"
              initial={{ x: "100%" }}
              animate={isHovered ? { x: "0%" } : { x: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export { QuizCard }

