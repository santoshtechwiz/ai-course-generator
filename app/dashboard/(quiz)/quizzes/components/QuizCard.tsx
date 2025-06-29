"use client"

import { useState, memo } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  FileQuestion,
  AlignJustify,
  Code,
  PenTool,
  Flashlight,
  Play,
  CheckCircle,
  Circle,
} from "lucide-react"
import { motion } from "framer-motion"
import { AsyncNavLink } from "@/components/ui/loader/index"

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
  // Quiz type information with color coding
  const quizTypeInfo = {
    mcq: {
      label: "Multiple Choice",
      icon: FileQuestion,
      color: "bg-blue-600",
      accent: "text-blue-600",
    },
    openended: {
      label: "Open Ended",
      icon: AlignJustify,
      color: "bg-green-600",
      accent: "text-green-600",
    },
    code: {
      label: "Code Challenge",
      icon: Code,
      color: "bg-purple-600",
      accent: "text-purple-600",
    },
    blanks: {
      label: "Fill in the Blanks",
      icon: PenTool,
      color: "bg-amber-600",
      accent: "text-amber-600",
    },
    flashcard: {
      label: "Flash Cards",
      icon: Flashlight,
      color: "bg-pink-600",
      accent: "text-pink-600",
    },
  }

  const { label, icon: Icon, color, accent } = quizTypeInfo[quizType] || quizTypeInfo.mcq

  // Determine button content based on completion
  const getButtonContent = () => {
    if (completionRate >= 100) {
      return {
        text: "Review Quiz",
        icon: CheckCircle,
      }
    } else if (completionRate > 0) {
      return {
        text: "Continue Quiz",
        icon: Play,
      }
    } else {
      return {
        text: "Start Quiz",
        icon: Play,
      }
    }
  }

  const buttonContent = getButtonContent()
  const ButtonIcon = buttonContent.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden flex flex-col border border-border/50 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex-grow space-y-5">
          {/* Title and Quiz Type */}
          <div className="space-y-2">
            <h3 className="font-bold text-xl text-foreground">
              {title}
            </h3>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${accent}`}>{label}</span>
              <span className="text-sm font-semibold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                Medium
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground">{description}</p>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{estimatedTime}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">{completionRate}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Medium</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Interactive</span>
            </div>
          </div>

          {/* Completion Section */}
          <div className="pt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground font-medium">
                Completion Rate
              </span>
              <span className={`text-sm font-bold ${accent}`}>
                {Math.round(completionRate)}%
              </span>
            </div>
            <Progress 
              value={completionRate} 
              className="h-2 bg-muted/50"
          
            />
          </div>
        </CardContent>

        <CardFooter className="px-6 pb-6 pt-0">
          <AsyncNavLink
            href={`/dashboard/${quizType}/${slug}`}
            className="w-full"
          >
            <Button
              className={`w-full h-11 font-bold ${color} hover:${color} text-white`}
            >
              <div className="flex items-center gap-2">
                <ButtonIcon className="w-4 h-4" />
                {buttonContent.text}
              </div>
            </Button>
          </AsyncNavLink>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export const QuizCard = memo(QuizCardComponent)