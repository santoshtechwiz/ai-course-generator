"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Clock, Star, Zap, ArrowRight, HelpCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { QuizCardProps } from "@/app/types"
import { useRouter } from "next/navigation"

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  hover: {
    y: -4,
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.98 },
}

const buttonVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.95 },
}

const QuizTypeIcon = ({ type }: { type: string }) => {
  const icon = type === "mcq" ? <HelpCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />
  return (
    <Badge variant={type === "mcq" ? "default" : "secondary"} className="text-xs">
      {icon}
      <span className="ml-1">{type.toUpperCase()}</span>
    </Badge>
  )
}

export const QuizCard: React.FC<QuizCardProps> = ({
  title,
  questionCount,
  isTrending,
  slug,
  quizType,
  estimatedTime = "5 min",
  description,
}) => {
  const router = useRouter()

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      className="max-w-sm mx-auto"
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary-foreground p-6 text-center">
          <div className="text-primary-foreground mb-4">
            <div className="inline-block bg-primary-foreground/30 p-3 rounded-full">
              <Zap className="h-10 w-10" />
            </div>
          </div>
          <CardTitle className="text-primary-foreground text-2xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <QuizTypeIcon type={quizType} />
            <Badge variant="outline" className="text-xs">
              <HelpCircle className="h-3 w-3 mr-1" />
              {questionCount} Questions
            </Badge>
            {isTrending && (
              <Badge variant="destructive" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>
          <CardDescription className="text-center">{description}</CardDescription>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => router.push(`/dashboard/${quizType === "mcq" ? "mcq" : "openended"}/${slug}`)}
          >
            Start Quiz
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

